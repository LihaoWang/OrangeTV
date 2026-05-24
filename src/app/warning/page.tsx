import { Metadata } from 'next';
import WarningClient from './warning-client';

export const metadata: Metadata = {
  title: '安全警告 - OrangeTV',
  description: '站点安全配置警告',
};

export default function WarningPage() {
  return <WarningClient />;
}
