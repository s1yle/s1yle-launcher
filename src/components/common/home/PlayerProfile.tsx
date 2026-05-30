import { Crown, User } from 'lucide-react';
import { UserRole } from '@/stores/userRoleStore';

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
  role = UserRole.PLAYER
}: PlayerProfileProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* 头像容器 - 简化 */}
      <div className="relative">
        <div className={`
          w-20 h-20 rounded-md overflow-hidden
          border-2 ${role === UserRole.ADMIN ? 'border-purple-500/30' : 'border-blue-500/30'}
          bg-bg-tertiary
        `}>
          <MCAvatar name={name} />
        </div>
        
        {/* 角色徽章角标 - 简化 */}
        <div className={`
          absolute -top-1 -right-1 w-5 h-5 rounded-full
          flex items-center justify-center
          ${role === UserRole.ADMIN ? 'bg-yellow-500' : 'bg-blue-500'}
        `}>
          {role === UserRole.ADMIN ? (
            <Crown className="w-2.5 h-2.5 text-white" />
          ) : (
            <User className="w-2.5 h-2.5 text-white" />
          )}
        </div>
      </div>

      {/* 用户名 - 简化 */}
      <h1 className="text-lg font-medium text-text-primary">
        {name}
      </h1>
    </div>
  );
};

export default PlayerProfile;
