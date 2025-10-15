'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Chrome, Globe } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Main Title */}
            <motion.h1
              className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              让数据表格，
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                焕然一新
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl text-gray-600 leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              AI 智能检测 · 一键清理 · 自动导出 CSV / Excel
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:from-blue-600 hover:to-purple-700"
                >
                  🚀 安装插件
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 text-lg hover:border-blue-500 hover:text-blue-600 bg-transparent"
                >
                  🎬 观看演示
                </Button>
              </motion.div>
            </motion.div>

            {/* Platform Icons */}
            <motion.div
              className="flex items-center space-x-6 pt-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <span className="text-sm text-gray-500 font-medium">支持平台：</span>
              <div className="flex items-center space-x-4">
                <motion.div
                  className="p-2 rounded-lg bg-white/60 shadow-sm"
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <Chrome className="w-6 h-6 text-gray-600" />
                </motion.div>
                <motion.div
                  className="p-2 rounded-lg bg-white/60 shadow-sm"
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">E</span>
                  </div>
                </motion.div>
                <motion.div
                  className="p-2 rounded-lg bg-white/60 shadow-sm"
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <Globe className="w-6 h-6 text-gray-600" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Demo Area */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-3xl"></div>
              
              {/* Demo Panel */}
              <motion.div
                className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20"
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">CaptainCleanSheet</span>
                </div>

                {/* Demo Content */}
                <div className="space-y-4">
                  <motion.div
                    className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, delay: 1.2 }}
                  ></motion.div>
                  
                  <motion.div
                    className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    transition={{ duration: 1.5, delay: 1.4 }}
                  ></motion.div>
                  
                  <motion.div
                    className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 1.5, delay: 1.6 }}
                  ></motion.div>

                  {/* Action Button in Demo */}
                  <motion.div
                    className="pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 2 }}
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg text-center">
                      ✨ 智能清理完成
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              ></motion.div>
              
              <motion.div
                className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full opacity-20"
                animate={{ 
                  y: [0, 15, 0],
                  rotate: [360, 180, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              ></motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}