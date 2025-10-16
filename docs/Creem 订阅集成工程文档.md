# Creem 订阅与支付集成工程文档

本工程已集成 Creem 的 Checkout Session、Webhook 验签与客户门户链接（API 封装）。本文档说明环境配置、接口使用与测试方法。

## 环境变量
- `CREEM_API_KEY`: 从 Creem Dashboard 获取，用于请求头 `x-api-key`。
- `CREEM_WEBHOOK_SECRET`: 用于 HMAC-SHA256 验签 Webhook 的 `creem-signature`。
- 可选：`CREEM_API_BASE`，默认 `https://api.creem.io`。测试模式可设置为 `https://test-api.creem.io`。
 - 可选：`CREEM_PRICE_PRO_MONTHLY_ID`、`CREEM_PRICE_PRO_TEAM_ID`：用于服务端产品白名单（推荐）。
 - 可选：`CREEM_DEFAULT_SUCCESS_PATH`、`CREEM_DEFAULT_CANCEL_PATH`：仅传路径（如 `/profile`），服务端在创建会话时使用 `new URL(path, origin)` 拼接完整 URL（Creem 仅支持 `success_url`，`cancel_path` 供前端/错误处理场景使用）。

配置文件：`/.env.example` 已包含占位符，请在本地 `.env` 写入真实值。

## 封装与接口

### Creem API 封装
- 路径：`lib/creem.ts`
- 能力：
  - `createCheckoutSession(payload)`：`POST /v1/checkouts`
  - `generateCustomerPortalLink(customerId)`：`POST /v1/customers/billing`
  - `upgradeSubscription(subscriptionId, productId, updateBehavior)`：`POST /v1/subscriptions/{id}/upgrade`
  - `verifyWebhookSignature(rawBody, signature)`：使用 `CREEM_WEBHOOK_SECRET` 做 HMAC-SHA256 验签

### 创建 Checkout Session
- 路由：`POST /api/checkout`
- 请求体（示例）：
```
{
  "product_id": "prod_123456",
  "units": 1,
  "discount_code": "BF2024",
  "customer": { "email": "user@example.com" },
  "lang": "zh",
  "success_url": "https://yourapp.com/return",
  "metadata": { "userId": "u_001" }
}
```
- 行为：
  - 自动生成 `request_id`（如未提供）
  - 默认 `success_url` 为本地化路径：优先使用请求体 `lang`（`zh`/`en`），否则从 `Referer` 或当前路径自动识别；最终拼接为 `new URL('/{lang}' + CREEM_DEFAULT_SUCCESS_PATH, origin)`；当无法识别语言时，回退为根路径版本
  - 若配置了 `CREEM_PRICE_PRO_MONTHLY_ID`/`CREEM_PRICE_PRO_TEAM_ID`，会校验 `product_id` 是否在白名单内，否则返回 403
  - 返回：
```
{
  "checkout_id": "ch_...",
  "checkout_url": "https://creem.io/checkout/...",
  "request_id": "..."
}
```

### Webhook 验证与事件处理
- 路由：`POST /api/webhooks/creem`
- 验签：读取原始请求体 `rawBody`，用 `CREEM_WEBHOOK_SECRET` 计算 `HMAC-SHA256` 与请求头 `creem-signature` 比较（常量时间对比）。
- 事件（示例）：
  - `checkout.completed`：包含一次性支付的 `request_id`，可在此履约（授予访问、发放 License 等）
  - `subscription.created` / `subscription.updated` / `subscription.canceled`：更新用户权益或订阅状态
- 当前实现记录日志，预留履约逻辑注入点。

## 标准集成与测试步骤

1. 在 Creem Dashboard 创建产品（一次性或订阅）。
2. 在环境中设置 `CREEM_API_KEY` 与（可选）`CREEM_API_BASE` 为测试或生产。
3. 调用 `POST /api/checkout` 生成会话并重定向至 `checkout_url`：
```
curl -X POST "https://localhost:3000/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod_6tW66i0oZM7w1qXReHJrwg",
    "customer": { "email": "user@example.com" },
    "metadata": { "userId": "u_001" }
  }'
```
4. 配置 Creem Webhook 指向 `https://<your-domain>/api/webhooks/creem`，填写 `CREEM_WEBHOOK_SECRET`。
5. 完成支付后，观察服务端日志（`checkout.completed`、`subscription.*`）以验证履约触发。

## 参考要点
- Checkout Session API：`POST /v1/checkouts`（请求体支持 `request_id`、`metadata`、`success_url`、`customer.email`、`discount_code`、`units` 等）
- 客户门户链接：`POST /v1/customers/billing`（传 `customer_id` 返回 URL）
- 订阅升级：`POST /v1/subscriptions/{id}/upgrade`（`update_behavior`: `proration-charge-immediately`/`proration-charge`/`proration-none`）
- Webhook 验签：头 `creem-signature`，算法 `HMAC-SHA256`，密钥为 `CREEM_WEBHOOK_SECRET`

后续可选：在前端定价页绑定购买按钮，调用 `/api/checkout` 并跳转至返回的 `checkout_url`；在数据库中持久化 `request_id` 与用户映射，结合 Webhook 完成自动履约。