import { Radio } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { Card, Chip } from '@heroui/react';

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
          <Card variant='secondary' className='flex-row items-center gap-3'>
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
                <Chip size='sm' variant='soft' color='accent' className='mt-1 max-w-full'>
                  {origin === 'live' ? (
                    <Radio size={12} className='mr-1.5 text-accent' />
                  ) : null}
                  <Chip.Label>{sourceName}</Chip.Label>
                </Chip>
              ) : null}
            </div>
          </Card>
        )}

        <Card variant='default' className='gap-1 p-1'>
          {actions.map((action) => (
            <AppButton
              key={action.id}
              variant='tertiary'
              fullWidth
              isDisabled={action.disabled}
              className='h-auto justify-start'
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
                <Chip size='sm' variant='secondary'>
                  <Chip.Label>{currentEpisode}/{totalEpisodes}</Chip.Label>
                </Chip>
              ) : null}
            </AppButton>
          ))}
        </Card>

        {isAggregate && sources && sources.length > 0 ? (
          <Card variant='secondary'>
            <div className='mb-3'>
              <h4 className='mb-1 text-sm font-medium text-foreground'>可用播放源</h4>
              <p className='text-sm text-muted'>共 {sources.length} 个播放源</p>
            </div>
            <AppScrollShadow className='max-h-32'>
              <div className='grid grid-cols-2 gap-2'>
                {sources.map((source) => (
                  <Chip key={source} size='sm' variant='secondary'>
                    <Chip.Label>{source}</Chip.Label>
                  </Chip>
                ))}
              </div>
            </AppScrollShadow>
          </Card>
        ) : null}
      </div>
    </AppDrawer>
  );
};

export default MobileActionSheet;
