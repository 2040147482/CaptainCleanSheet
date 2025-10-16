# **CaptainCleanSheet** 定制的、工程级 **Creem 集成开发方案（网站端）**



# 一、概览（目标 & 高层架构）

**集成目标（简述）**

- 用户在官网选择订阅 → 网站创建 Creem Checkout Session → 用户在 Creem 完成支付 → Creem 通过 Webhook 通知网站 → 网站验证事件并更新 Supabase（`profiles.plan` 与 `subscriptions`）→ 插件通过 `GET /api/user/plan` 获取最新计划并解锁功能。

**高层架构图**

```
sequenceDiagram
  participant Browser as User Browser
  participant WebApp as Website (Next.js)
  participant Creem as Creem API
  participant Webhook as Website.WebhookHandler
  participant DB as Supabase (Postgres)

  Browser->>WebApp: Click "Subscribe" (priceId)
  WebApp->>Creem: POST /v1/checkouts (create checkout session)
  Creem-->>Browser: Redirect to hosted checkout URL
  Browser->>Creem: Completes payment (hosted)
  Creem->>Webhook: POST webhook (checkout.completed)
  Webhook->>DB: verify & upsert subscriptions, update profiles.plan
  DB-->>WebApp: plan updated
  Browser->>WebApp: redirect /success (optional)
  Browser->>Extension: plugin polls /api/user/plan -> uses plan
```

------

# 二、官方文档关键要点（已检索引用）

- 创建 Checkout Session：说明如何以 `product_id` 创建会话并得到 `session.url`（redirect）。[docs.creem.io+1](https://docs.creem.io/api-reference/endpoint/create-checkout?utm_source=chatgpt.com)
- 产品 / 价格 API：获取 product/price id 与属性以展示和用于创建会话。[docs.creem.io](https://docs.creem.io/api-reference/endpoint/search-products?utm_source=chatgpt.com)
- Webhooks：Creem 使用 `creem-signature` header，签名采用 HMAC-SHA256(secret, payload)。必须验签。[docs.creem.io](https://docs.creem.io/learn/webhooks/verify-webhook-requests?utm_source=chatgpt.com)
- Webhook 事件类型（如 `checkout.completed`, `subscription.*`）及示例 payload，用于决定后端动作。[docs.creem.io](https://docs.creem.io/learn/webhooks/event-types?utm_source=chatgpt.com)
- 订阅管理（升级/取消/试用/计费周期等）的 API 与行为（proration、upgrade behaviors）。[docs.creem.io](https://docs.creem.io/api-reference/endpoint/upgrade-subscription?utm_source=chatgpt.com)

------

# 三、数据库模型（Supabase）与 DDL（建议）

基于之前讨论，扩展或新增表（SQL 可直接在 Supabase 执行）：

```
-- profiles 扩展（若已存在，可 alter）
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  email text,
  plan text default 'free', -- 'free'|'pro'|'team'
  plan_expires timestamptz,
  created_at timestamptz default now()
);

-- subscriptions 存储外部订阅记录
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  provider text, -- 'creem'
  provider_subscription_id text,
  product_id text,
  price_id text,
  status text,
  started_at timestamptz,
  current_period_end timestamptz,
  metadata jsonb,
  created_at timestamptz default now()
);

-- webhook 日志（幂等与审计）
create table if not exists webhooks_log (
  id uuid primary key default gen_random_uuid(),
  event_id text unique,  -- Creem event id, 用于幂等
  event_type text,
  payload jsonb,
  processed boolean default false,
  processed_at timestamptz
);
```

------

# 四、API 映射表（Creem event → 后端动作）

| Creem Event                                         | 触发时点           | 后端动作                                                     |
| --------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| `checkout.completed` / `checkout.session.completed` | 用户 checkout 完成 | 识别 customer（email / metadata），创建 `subscriptions` / `payments` 记录，设置 `profiles.plan = 'pro'`（或相应 plan），设置 `plan_expires`（按 current_period_end）。[docs.creem.io](https://docs.creem.io/learn/webhooks/event-types?utm_source=chatgpt.com) |
| `subscription.created` / `subscription.updated`     | 订阅创建/更新      | upsert `subscriptions` 表，更新 status、current_period_end 等。[docs.creem.io](https://docs.creem.io/api-reference/endpoint/upgrade-subscription?utm_source=chatgpt.com) |
| `subscription.cancelled`                            | 用户取消           | 更新 `subscriptions.status = 'canceled'`，如果需要立即停用则更新 profile。 |
| `invoice.payment_failed`（若存在）                  | 扣款失败           | 将 subscription 标记 `past_due`，发送通知，并按策略重试/暂停服务。 |
| Refund / Chargebacks                                | 退款/争议          | 创建 audit entry，通知客服并回滚权限（如需）。               |

------

# 五、关键服务器端实现（Next.js / TypeScript 示例）

下面示例以 Next.js App Router `route.ts` 文件为准，使用 `creem` SDK（或 HTTP）。示例包括：创建 checkout session、webhook handler（含签名校验与幂等性）、查询 plan。

> 依赖：`npm i creem @supabase/supabase-js jsonwebtoken`（示例）

### 1) 创建 Checkout Session（`/app/api/checkout/route.ts`）

```
// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Creem from 'creem';
import { getServerSession } from '@/lib/session'; // 你项目的 session helper

const creem = new Creem(process.env.CREEM_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.json();
  const { priceId } = body;
  const session = await getServerSession(); // 确保用户登录
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // create checkout session on Creem
  const checkout = await creem.checkout.create({
    priceId, // 根据 creem doc
    customer: { email: session.user.email },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?status=cancel`,
    metadata: { user_id: session.user.id }
  });

  return NextResponse.json({ url: checkout.url });
}
```

> 说明：Creem 文档示例中 `createSession` 接收 `product_id` / `priceId` 等字段，请参照你控制台的实际字段。[docs.creem.io](https://docs.creem.io/api-reference/endpoint/create-checkout?utm_source=chatgpt.com)

------

### 2) Webhook 接收与验签（`/app/api/creem/webhook/route.ts`）

```
// app/api/creem/webhook/route.ts
import { NextResponse } from 'next/server';
import Creem from 'creem';
import { supabaseAdmin } from '@/lib/supabaseServer';

const creem = new Creem(process.env.CREEM_SECRET_KEY!);

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('creem-signature') || '';

  // Use SDK helper (if exists) or validate HMAC-SHA256 manually
  let event;
  try {
    event = creem.webhooks.constructEvent(raw, signature, process.env.CREEM_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventId = event.id || event.data?.id || `${event.type}_${Date.now()}`;

  // Idempotency: check webhooks_log
  const { data: existing } = await supabaseAdmin
    .from('webhooks_log')
    .select('*')
    .eq('event_id', eventId)
    .single();

  if (existing) {
    // Already processed
    return NextResponse.json({ ok: true });
  }

  // Log event for audit & future retry
  await supabaseAdmin.from('webhooks_log').insert({
    event_id: eventId,
    event_type: event.type,
    payload: event,
    processed: false
  });

  // Process event types
  try {
    if (event.type === 'checkout.completed' || event.type === 'checkout.session.completed') {
      const checkout = event.data;
      const userId = checkout.metadata?.user_id;
      const productId = checkout.product_id || checkout.price_id;
      const current_period_end = checkout.subscription?.current_period_end || checkout.order?.current_period_end;

      // upsert subscription & set profile plan
      await supabaseAdmin.from('subscriptions').insert({
        user_id: userId,
        provider: 'creem',
        provider_subscription_id: checkout.subscription?.id || checkout.order?.id,
        product_id: productId,
        price_id: checkout.price_id || null,
        status: 'active',
        started_at: new Date().toISOString(),
        current_period_end: current_period_end ? new Date(current_period_end).toISOString() : null,
        metadata: checkout
      });

      await supabaseAdmin.from('profiles').update({
        plan: 'pro',
        plan_expires: current_period_end ? new Date(current_period_end).toISOString() : null
      }).eq('id', userId);
    } else if (event.type.startsWith('subscription.')) {
      // handle subscription.updated / canceled
      const sub = event.data;
      const userId = sub.metadata?.user_id;
      // update subscription accordingly...
      await supabaseAdmin.from('subscriptions')
        .update({ status: sub.status, current_period_end: sub.current_period_end })
        .eq('provider_subscription_id', sub.id);
    }
    // mark processed
    await supabaseAdmin.from('webhooks_log').update({ processed: true, processed_at: new Date().toISOString() }).eq('event_id', eventId);
  } catch (err) {
    console.error('Error processing webhook', err);
    // keep event logged for retry
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

**验签要点**：Creem 在 header `creem-signature` 中放 HMAC-SHA256 签名，签名 key 为你在 Creem 控制台设置的 webhook secret。必须在接收端用相同算法与 secret 对 `raw` payload 做校验并拒绝不匹配的请求。[docs.creem.io](https://docs.creem.io/learn/webhooks/verify-webhook-requests?utm_source=chatgpt.com)

------

### 3) 查询用户 plan（`GET /api/user/plan`）

```
// app/api/user/plan/route.ts
import { NextResponse } from 'next/server';
import { requireAuthFromHeader } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  const payload = requireAuthFromHeader(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (payload as any).sub;
  const { data: profile } = await supabaseAdmin.from('profiles').select('plan, plan_expires').eq('id', userId).single();

  const features = {
    ai_insights: profile?.plan === 'pro' || profile?.plan === 'team',
    max_rows: profile?.plan === 'pro' || profile?.plan === 'team' ? 'unlimited' : 1000,
    team_sharing: profile?.plan === 'team'
  };

  return NextResponse.json({ plan: profile?.plan || 'free', plan_expires: profile?.plan_expires, features });
}
```

------

# 六、Webhook 签名（实现细节）

Creem 文档明确说明：`creem-signature` header 使用 HMAC-SHA256 以 webhook secret 为 key，对原始请求体（raw payload）进行签名。你应：

1. 读取 `req.text()` 得到原始字符串 `raw`.
2. 计算 `expected = HMAC_SHA256(webhook_secret, raw)`（hex 或 base64，参见 Creem 文档返回格式）。
3. 与 header 中 `creem-signature` 做恒时比较（timing-safe compare）。
4. 若不匹配返回 HTTP 400。

示例（Node.js）：

```
import crypto from 'crypto';

function verifySignature(raw: string, signatureHeader: string, secret: string) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(raw);
  const expected = hmac.digest('hex'); // or 'base64' per Creem doc
  // timing-safe compare
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
```

> 注意：请确认 Creem 返回签名的编码（hex / base64）。官方文档示例中使用 HMAC-SHA256（参照文档）。[docs.creem.io](https://docs.creem.io/learn/webhooks/verify-webhook-requests?utm_source=chatgpt.com)

------

# 七、错误处理与重试策略

**Webhook**

- 验签失败：返回 400，记录日志并报警（可能是变更 secret 或攻击）。
- 处理失败（DB 错误 / transient）：返回 500（Creem 将重试），并确保幂等（通过 `event_id` 去重）。
- 幂等策略：在 `webhooks_log` 中插入 `event_id`（unique），若已存在则直接返回 200。

**Checkout / Payment**

- 如果 Checkout session 创建失败：前端向用户展示错误并记录 telemetry（Sentry）。
- 退款 / chargebacks：将事件记录并通知运营/客服（audit trail 在 `webhooks_log`）。

**Retries**

- 对于 transient errors: 使用 exponential backoff（例如 1m, 5m, 25m）进行 retry queue（将 webhook events push 到队列如 Bull / RQ）。

------

# 八、测试指南（本地/生产）

## 1) 模拟 Create Checkout（curl）

```
curl -X POST https://api.creem.io/v1/checkouts \
 -H "x-api-key: pk_test_xxx" \
 -H "Content-Type: application/json" \
 -d '{"product_id":"prod_xxx","metadata":{"user_id":"user-uuid"}}'
```

（若使用 SDK，请参阅 SDK 示例）[docs.creem.io](https://docs.creem.io/api-reference/endpoint/create-checkout?utm_source=chatgpt.com)

## 2) 模拟 Webhook 回放（curl）

保存示例 payload `payload.json`，然后：

```
curl -X POST https://captaincleansheet.com/api/creem/webhook \
 -H "Content-Type: application/json" \
 -H "creem-signature: <computed_signature>" \
 --data-binary @payload.json
```

说明：需用相同 secret 用 HMAC-SHA256 计算 `creem-signature`。官方 docs 提供示例 payload。[docs.creem.io+1](https://docs.creem.io/learn/webhooks/event-types?utm_source=chatgpt.com)

## 3) End-to-end （使用 Creem Test Mode）

- 在 Creem 控制台开启 Test Mode，使用 test API keys（docs Quickstart 指引）。[docs.creem.io](https://docs.creem.io/quickstart?utm_source=chatgpt.com)
- 在网站上点击订阅（调用 `POST /api/checkout`），跳转到 Creem checkout，使用测试卡完成支付（Creem 控制台提供）。
- 在 webhook handler 中观察 `webhooks_log` 与 `subscriptions` 表是否写入正确并生效。

------

# 九、上线 & 监控建议

**预上线（Staging）**

- 使用 Creem test keys & test webhook endpoint。
- QA 执行完整支付回调 & edge cases（重复事件、失败支付、退款）。

**生产上线**

1. 配置 `CREEM_SECRET_KEY`, `CREEM_WEBHOOK_SECRET` 于环境变量并仅在 server-side 使用。
2. 配置 Creem 控制台 webhook 到生产 endpoint，启用签名校验。
3. 监控：Webhook 失败率、未签名 webhook、checkout create failures、failed payments。建议接入 Sentry + PagerDuty。

**回滚策略**

- 若 webhook processing 导致数据异常：临时将 webhook endpoint 改为 `200 OK` 并 log only，阻止再执行变更；修复后重放未处理的 webhooks（从 Creem 控制台导出或从 logs 回放）。

------

# 十、合规与安全要点

- **密钥管理**：`CREEM_SECRET_KEY` 与 `CREEM_WEBHOOK_SECRET` 仅放服务端 env；轮换密钥时先添加新密钥并支持回退验证期。
- **短期 tokens**：对插件颁发的 token 建议短时有效（1h）并可用 refresh flow。
- **审计**：所有 webhook 与重要动作写入 `webhooks_log` 与 `subscriptions` 做审计。
- **数据隐私**：在隐私条款中明确记录需收集哪些支付/usage 信息；支持用户数据导出/删除（GDPR）。

------

# 十一、开发/QA 验收清单（Deliverable Checklist）

**基础功能**

-  使用 Creem test keys 在 staging 创建 checkout session 并跳转到 checkout 页面（成功）。
-  Creem webhook 成功回调后，`webhooks_log` 有记录且 `profiles.plan` 更新为 `pro`。
-  插件经 `GET /api/user/plan` 能返回正确 `features`（ai_insights 等）。

**健壮性**

-  Webhook 签名校验准确（直接在请求中篡改 payload 被拒绝）。
-  幂等性：重复 webhook 多次回放不会重复生效。
-  异常恢复：数据库或第三方故障能正确入 queue 并重试。

**安全 & 合规**

-  `CREEM_SECRET_KEY` / `CREEM_WEBHOOK_SECRET` 不存在前端或 logs。
-  隐私策略页面更新，列明 payments 相关数据使用方式。

**上生产前**

-  预演生产回放流程（在 Creem 控制台导出事件并在 staging 回放）。
-  运维监控（Webhook error rate > 1% 报警，checkout failure rate 报警）。

------

# 十二、参考官方文档（Cursor 检索到并使用的关键页面）

下面列出 Cursor 用于生成此集成方案的 Creem 官方文档（你或开发者可点击查看）：

1. Create Checkout Session (API reference). [docs.creem.io](https://docs.creem.io/api-reference/endpoint/create-checkout?utm_source=chatgpt.com)
2. Checkout Flow / Standard Integration (Quickstart). [docs.creem.io+1](https://docs.creem.io/checkout-flow?utm_source=chatgpt.com)
3. Webhooks — Verify Webhook Requests (signature/HMAC-SHA256). [docs.creem.io](https://docs.creem.io/learn/webhooks/verify-webhook-requests?utm_source=chatgpt.com)
4. Webhook Event Types (e.g. `checkout.completed`, subscription events). [docs.creem.io](https://docs.creem.io/learn/webhooks/event-types?utm_source=chatgpt.com)
5. Products / List Products API reference. [docs.creem.io](https://docs.creem.io/api-reference/endpoint/search-products?utm_source=chatgpt.com)
6. Subscriptions API (upgrade/cancel behavior). [docs.creem.io](https://docs.creem.io/api-reference/endpoint/upgrade-subscription?utm_source=chatgpt.com)
7. Introduction & Quickstart overview (general). [docs.creem.io+1](https://docs.creem.io/introduction?utm_source=chatgpt.com)