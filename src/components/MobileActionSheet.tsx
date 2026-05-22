import { Radio } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

import { AppButton, AppDrawer, AppScrollShadow } from './ui/HeroPrimitives';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: (e?: React.MouseEvent) => void | Promise<void>;
  color?: 'default' | 'danger' | 'primary';
  disabled?: boolean;
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actions: ActionItem[];
  poster?: string;
  sources?: string[];
  isAggregate?: boolean;
  sourceName?: string;
  currentEpisode?: number;
  totalEpisodes?: number;
  origin?: 'vod' | 'live';
}

const actionToneClass: Record<NonNullable<ActionItem['color']>, string> = {
  default: 'text-foreground',
  danger: 'text-danger',
  primary: 'text-accent',
};

const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  actions,
  poster,
  sources,
  isAggregate,
  sourceName,
  currentEpisode,
  totalEpisodes,
  origin = 'vod',
}) => {
  return (
    <AppDrawer
      isOpen={isOpen}
      onOpenChange={(nextIsOpen) => {
        if (!nextIsOpen) onClose();
      }}
      title={title}
      description='选择操作'
      className='max-h-[86dvh]'
      placement='bottom'
    >
      <div className='space-y-4'>
        {(poster || sourceName) && (
          <div className='flex items-center gap-3 rounded-lg border border-border/70 bg-surface-secondary/60 p-3'>
            {poster && (
              <div className='relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md border border-border/70 bg-surface-secondary/60'>
                <Image
                  src={poster}
                  alt={title}
                  fill
                  className={origin === 'live' ? 'object-contain' : 'object-cover'}
                  loading='lazy'
                />
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <p className='truncate text-base font-semibold text-foreground'>{title}</p>
              {sourceName ? (
                <span className='a2-data mt-1 inline-flex max-w-full items-center border border-border/70 px-2 py-1 text-[10px] text-muted'>
                  {origin === 'live' ? (
                    <Radio size={12} className='mr-1.5 text-accent' />
                  ) : null}
                  <span className='truncate'>{sourceName}</span>
                </span>
              ) : null}
            </div>
          </div>
        )}

        <div className='divide-y divide-border/10 overflow-hidden rounded-lg border border-border/70'>
          {actions.map((action) => (
            <AppButton
              key={action.id}
              variant='tertiary'
              fullWidth
              isDisabled={action.disabled}
              className='h-auto justify-start rounded-none px-3 py-4'
              onPress={() => {
                action.onClick();
                onClose();
              }}
            >
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center ${
                  action.disabled
                    ? 'text-muted/60'
                    : actionToneClass[action.color || 'default']
                }`}
              >
                {action.icon}
              </span>
              <span
                className={`min-w-0 flex-1 text-left text-base font-medium ${
                  action.disabled ? 'text-muted/60' : 'text-foreground'
                }`}
              >
                {action.label}
              </span>
              {action.id === 'play' && currentEpisode && totalEpisodes ? (
                <span className='a2-data text-xs text-muted'>
                  {currentEpisode}/{totalEpisodes}
                </span>
              ) : null}
            </AppButton>
          ))}
        </div>

        {isAggregate && sources && sources.length > 0 ? (
          <div className='rounded-lg border border-border/70 p-3'>
            <div className='mb-3'>
              <h4 className='mb-1 text-sm font-medium text-foreground'>可用播放源</h4>
              <p className='a2-kicker'>共 {sources.length} 个播放源</p>
            </div>
            <AppScrollShadow className='max-h-32'>
              <div className='grid grid-cols-2 gap-2'>
                {sources.map((source) => (
                  <div
                    key={source}
                    className='flex min-w-0 items-center gap-2 border-l border-border/70 px-3 py-2'
                  >
                    <div className='h-1.5 w-1.5 flex-shrink-0 bg-accent/80' />
                    <span className='truncate text-xs text-muted'>
                      {source}
                    </span>
                  </div>
                ))}
              </div>
            </AppScrollShadow>
          </div>
        ) : null}
      </div>
    </AppDrawer>
  );
};

export default MobileActionSheet;
