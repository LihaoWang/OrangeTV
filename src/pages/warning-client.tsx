'use client';

import { Alert, Card, Chip } from '@heroui/react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function WarningClient() {
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card variant='default' className='max-w-2xl w-full p-4 sm:p-8'>
        <Card.Header className='items-center text-center'>
          <Chip color='danger' variant='secondary' size='lg'>
            <ShieldAlert className='h-6 w-6' />
          </Chip>
          <Card.Title className='mt-4 text-2xl sm:text-3xl'>
            安全合规配置警告
          </Card.Title>
        </Card.Header>

        <Card.Content className='space-y-4 sm:space-y-6'>
          <Alert status='danger'>
            <Alert.Indicator>
              <AlertTriangle className='h-5 w-5' />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>安全风险提示</Alert.Title>
              <Alert.Description>
                检测到您的站点未配置访问控制，存在潜在的安全风险和法律合规问题。
              </Alert.Description>
            </Alert.Content>
          </Alert>

          <div className='space-y-3 sm:space-y-4'>
            <h2 className='text-lg sm:text-xl font-semibold'>主要风险</h2>
            <ul className='space-y-2 sm:space-y-3 text-sm sm:text-base text-muted'>
              <li className='flex items-start gap-2'>
                <Chip color='danger' size='sm'>1</Chip>
                <span>未经授权的访问可能导致内容被恶意传播</span>
              </li>
              <li className='flex items-start gap-2'>
                <Chip color='danger' size='sm'>2</Chip>
                <span>服务器资源可能被滥用，影响正常服务</span>
              </li>
              <li className='flex items-start gap-2'>
                <Chip color='danger' size='sm'>3</Chip>
                <span>可能收到相关权利方的法律通知</span>
              </li>
              <li className='flex items-start gap-2'>
                <Chip color='danger' size='sm'>4</Chip>
                <span>服务提供商可能因合规问题终止服务</span>
              </li>
            </ul>
          </div>

          <Alert status='warning'>
            <Alert.Title>安全配置建议</Alert.Title>
            <Alert.Description>
              请立即配置{' '}
              <code className='font-mono text-xs sm:text-sm'>PASSWORD</code>{' '}
              环境变量以启用访问控制。
            </Alert.Description>
          </Alert>
        </Card.Content>

        <Card.Footer>
          <div className='text-center text-xs sm:text-sm text-muted w-full'>
            <p>为确保系统安全性和合规性，请及时完成安全配置</p>
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
}
