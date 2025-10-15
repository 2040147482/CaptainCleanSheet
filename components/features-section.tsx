'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, BarChart3, Download } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: '智能检测',
    description: '自动识别混乱表格结构',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Sparkles,
    title: '深度清理',
    description: '一键删除噪音数据',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: BarChart3,
    title: 'AI 洞察',
    description: '生成智能报告',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Download,
    title: '导出报告',
    description: '支持多格式导出',
    gradient: 'from-orange-500 to-red-500'
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            四大核心功能
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            让数据处理变得简单高效，释放您的创造力
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <motion.div
                key={feature.title}
                className="group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: 'easeOut'
                }}
              >
                <motion.div
                  className="relative h-full p-8 rounded-xl bg-white/60 backdrop-blur-sm shadow-md border border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                  whileHover={{ 
                    y: -8,
                    scale: 1.02
                  }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 20 
                  }}
                >
                  {/* Icon Container */}
                  <motion.div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6 shadow-lg`}
                    whileHover={{ 
                      rotate: [0, -10, 10, 0],
                      scale: 1.1
                    }}
                    transition={{ 
                      duration: 0.6,
                      ease: 'easeInOut'
                    }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover Effect Background */}
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />

                  {/* Decorative Elements */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="absolute bottom-4 left-4 w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Decoration */}
        <motion.div
          className="flex justify-center mt-16"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="flex space-x-2">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}