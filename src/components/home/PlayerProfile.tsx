import { motion } from 'framer-motion';
import { Crown, User } from 'lucide-react';
import { useUserRoleStore, type UserRole } from '@/stores/userRoleStore';

// MC 方块人头像组件 (Steve/Alex 风格)
const MCAvatar = ({ name = 'Steve' }: { name?: string }) => {
  // 生成基于名字的皮肤颜色变体
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const skinTone = hash % 2 === 0 ? '#c89b6f' : '#d4a574'; // Steve 或 Alex 肤色
  const shirtColor = hash % 3 === 0 ? '#00aaaa' : hash % 3 === 1 ? '#8b4513' : '#5555ff';
  const hairColor = hash % 4 === 0 ? '#4a3728' : hash % 4 === 1 ? '#8b4513' : '#2d1b0e';

  return (
    <div 
      className="w-full h-full bg-[#1a1a2e] relative"
      style={{
        imageRendering: 'pixelated',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {/* 像素风格 MC 头像 - 使用 CSS grid 模拟 */}
      <svg
        viewBox="0 0 8 8"
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* 帽子/头发层 */}
        <rect x="1" y="0" width="6" height="1" fill={hairColor} />
        
        {/* 脸部 */}
        <rect x="1" y="1" width="6" height="4" fill={skinTone} />
        
        {/* 眼睛 - 白色部分 */}
        <rect x="2" y="2" width="1" height="1" fill="#fff" />
        <rect x="5" y="2" width="1" height="1" fill="#fff" />
        
        {/* 眼睛 - 瞳孔 */}
        <rect x="2" y="2" width="1" height="1" fill="#3d2817">
          <animate attributeName="fill" values="#3d2817;#5d4837;#3d2817" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="5" y="2" width="1" height="1" fill="#3d2817">
          <animate attributeName="fill" values="#3d2817;#5d4837;#3d2817" dur="3s" repeatCount="indefinite" />
        </rect>
        
        {/* 鼻子 */}
        <rect x="3.5" y="3" width="1" height="1" fill="#a67c52" />
        
        {/* 嘴巴 - 微笑 */}
        <rect x="3" y="4" width="2" height="1" fill="#6b4423" />
        <rect x="2" y="4" width="1" height="1" fill={skinTone} />
        <rect x="5" y="4" width="1" height="1" fill={skinTone} />
        
        {/* 身体/衣服 */}
        <rect x="1" y="5" width="6" height="3" fill={shirtColor} />
        
        {/* 衣服细节 - 领口 */}
        <rect x="3" y="5" width="2" height="1" fill={skinTone} />
        
        {/* 衣服细节 - 纹理 */}
        <rect x="1" y="6" width="1" height="1" fill={shirtColor} opacity="0.8" />
        <rect x="6" y="6" width="1" height="1" fill={shirtColor} opacity="0.8" />
      </svg>
    </div>
  );
};

interface PlayerProfileProps {
  name: string;
  role?: UserRole;
}

const PlayerProfile = ({
  name,
  role = 'player'
}: PlayerProfileProps) => {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
    >
      {/* 头像容器 */}
      <motion.div
        className="relative group cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 外圈光晕效果 */}
        <div
          className={`
            absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-50
            transition-opacity duration-500
            ${role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}
          `}
          style={{ transform: 'scale(1.15)' }}
        />

        {/* MC 方块人头像 */}
        <div className={`
          relative w-32 h-32 rounded-2xl overflow-hidden
          ring-4 ring-[var(--color-bg-primary)] shadow-2xl
          ${role === 'admin' ? 'ring-purple-500/30' : 'ring-blue-500/30'}
          bg-[#2a2a3e]
        `}>
          <MCAvatar name={name} />
          
          {/* 扫描线动画效果 */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"
            style={{
              animation: 'scanline 3s linear infinite',
              backgroundSize: '100% 200%',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* 角色徽章 */}
        <motion.div
          className={`
            absolute -top-1 -right-1 w-8 h-8 rounded-full
            flex items-center justify-center shadow-lg
            ${role === 'admin'
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
              : 'bg-gradient-to-br from-blue-400 to-blue-600'
            }
          `}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 15 }}
        >
          {role === 'admin' ? (
            <Crown className="w-4 h-4 text-white" />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </motion.div>
      </motion.div>

      {/* 用户名 */}
      <motion.h1
        className="mt-6 text-3xl font-bold text-[var(--color-text-primary)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {name}
      </motion.h1>
    </motion.div>
  );
};

export default PlayerProfile;
