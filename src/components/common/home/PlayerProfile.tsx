import { Crown, User } from 'lucide-react';
import { UserRole } from '@/stores/userRoleStore';
import { SkinAvatar } from '../SkinAvatar';
import { useAuthStore } from '@/stores/authStore';
import { useAvatarStore } from '@/stores/avatarStore';


interface PlayerProfileProps {
  name: string;
  role?: UserRole;
}

/**
 * 玩家资料卡片组件。
 * 显示玩家头像（支持平面/等距模式）、角色徽章和用户名。
 */
const PlayerProfile = ({
  name,
  role = UserRole.PLAYER
}: PlayerProfileProps) => {
  const avatarMode = useAvatarStore((s) => s.mode);
  const currentAccount = useAuthStore((s) => s.currentAccount);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* 头像容器 */}
      <div className="relative">
        <div className={`
          overflow-hidden
          ${role === UserRole.ADMIN ? 'skip_border-purple-500/30' : 'skip_border-blue-500/30'}
          bg-bg-tertiary
        `}>
          <SkinAvatar
            // mmili985 uuid: uuid='f8ab99b9-9e45-4001-a9ea-0f5c9ca285c8' 
            uuid={currentAccount?.uuid ? currentAccount.uuid : ""}
            showHat={true}
            size={90}
            avatarMode={avatarMode}
          />
        </div>

        {/* 角色徽章角标 */}
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

      {/* 渲染模式切换 */}
      {/* TODO: 实现一个通用多选一组件 */}
      {/* TODO: 切换时播放加载动画 */}
      {/* FIXME: 修复平面模式下，部分皮肤不显示眼睛的问题 */}

      {/* 用户名 */}
      <h1 className="text-base/2 font-light text-(--color-text-primary)">
        {name}
      </h1>
    </div>
  );
};

export default PlayerProfile;




// MC 方块人头像组件 (Steve/Alex 风格) (弃用)
