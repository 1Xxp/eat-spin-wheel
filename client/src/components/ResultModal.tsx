import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpinResult } from '../api/types';
import { shareDish } from '../utils/share';

interface Props {
  result: SpinResult | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRetry: () => void;
}

export default function ResultModal({ result, open, onClose, onConfirm, onRetry }: Props) {
  const [shareImg, setShareImg] = useState<string | null>(null);

  const handleShare = () => {
    if (!result) return;
    const url = shareDish(result.dish.emoji, result.dish.name, result.ai_text);
    if (url) setShareImg(url);
  };

  if (!result) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-[#5D4037]/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 分享图预览 */}
          <AnimatePresence>
            {shareImg && (
              <motion.div
                className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShareImg(null)}
              >
                <motion.img
                  src={shareImg}
                  alt="分享图"
                  className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-2xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                />
                <p className="absolute bottom-8 text-white/70 text-xs text-center w-full">
                  长按图片保存 · 点击空白处关闭
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 卡片 */}
          <motion.div
            className="relative w-full sm:w-[360px] bg-white rounded-t-3xl sm:rounded-3xl px-6 pt-6 pb-8 sm:pb-6 mx-0 sm:mx-4 shadow-2xl shadow-brand-200/40"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="sm:hidden w-10 h-1 rounded-full bg-brand-100 mx-auto mb-5" />

            <div className="text-center mb-4">
              <motion.div
                className="text-[72px] mb-2"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
              >
                {result.dish.emoji}
              </motion.div>
              <motion.h2
                className="text-[26px] font-extrabold text-[#5D4037]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {result.dish.name}
              </motion.h2>
              <motion.p
                className="text-xs text-[#B0887A] mt-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {result.category_name}
              </motion.p>
            </div>

            <div
              className="bg-brand-50 rounded-2xl px-4 py-3.5 mb-5 min-h-[52px] flex items-center justify-center text-center border border-brand-100 animate-fadeIn"
              style={{ animationDelay: '0.35s' }}
            >
              <p className="text-brand-600 text-[15px] font-medium leading-relaxed">
                {result.ai_text}
              </p>
            </div>

            <motion.div
              className="mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={handleShare}
                className="w-full h-10 rounded-2xl bg-brand-50 text-brand-600 text-[13px] font-semibold active:bg-brand-100 transition-colors"
              >
                📤 生成分享图
              </button>
            </motion.div>

            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <button
                onClick={onConfirm}
                className="flex-1 h-12 rounded-2xl bg-brand-50 text-brand-600 text-[15px] font-semibold active:bg-brand-100 transition-colors"
              >
                就它了 ✓
              </button>
              <button
                onClick={onRetry}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-brand-400 to-brand-500 text-white text-[15px] font-semibold active:scale-[0.97] transition-all shadow-lg shadow-brand-300/40"
              >
                换一个 🔄
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
