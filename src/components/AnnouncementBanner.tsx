'use client';

import { Button, Card } from '@heroui/react';

interface AnnouncementBannerProps {
  announcement: string;
  onDismiss: () => void;
}

export function AnnouncementBanner({
  announcement,
  onDismiss,
}: AnnouncementBannerProps) {
  return (
    <Card>
      <Card.Header className='flex-row items-start justify-between gap-4'>
        <div>
          <Card.Description>Announcement</Card.Description>
          <Card.Title>提示</Card.Title>
        </div>
        <Button size='sm' variant='secondary' onPress={onDismiss}>
          我知道了
        </Button>
      </Card.Header>
      <Card.Content>
        <p className='text-sm leading-6 text-muted'>{announcement}</p>
      </Card.Content>
    </Card>
  );
}
