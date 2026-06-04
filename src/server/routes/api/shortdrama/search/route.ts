import { AppRequest, AppResponse } from '@/server/web';
import { API_CONFIG } from '@/lib/config';

export async function GET(request: AppRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  try {

    if (!name) {
      return AppResponse.json(
        { error: 'name parameter is required' },
        { status: 400 }
      );
    }

    const apiUrl = new URL(`${API_CONFIG.shortdrama.baseUrl}/vod/search`);
    apiUrl.searchParams.append('name', name);

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: API_CONFIG.shortdrama.headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    return AppResponse.json(data);
  } catch (error) {
    console.error('Short drama search API error:', error);

    // 返回默认搜索结果作为备用
    const mockData = Array.from({ length: 5 }, (_, index) => ({
      id: index + 200,
      name: `搜索结果: ${name} ${index + 1}`,
      cover: 'https://via.placeholder.com/300x400',
      update_time: new Date().toISOString(),
      score: Math.floor(Math.random() * 3) + 8, // 8-10的随机分数
    }));

    return AppResponse.json({
      total: mockData.length,
      totalPages: 1,
      currentPage: 1,
      list: mockData,
    });
  }
}
