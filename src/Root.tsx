import { Composition } from 'remotion';
import { TextVideo, TextVideoSchema } from './TextVideo';
import { EcommerceAd, EcommerceAdSchema } from './EcommerceAd';
import { SlideVideo, SlideVideoSchema } from './SlideVideo';

export const Root = () => {
  return (
    <>
      <Composition
        id="TextVideo"
        component={TextVideo}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        schema={TextVideoSchema}
        defaultProps={{
          lines: ['你好世界', '精彩每一天', '向前出发', '未来可期'],
          textColor: '#ffffff',
          accentColor: '#f59e0b',
          backgroundColor: '#1e1b4b',
        }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.lines.length * 90,
        })}
      />

      <Composition
        id="EcommerceAd"
        component={EcommerceAd}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        schema={EcommerceAdSchema}
        defaultProps={{
          brandName: '潮流旗舰店',
          tagline: '品质生活 · 从这里开始',
          productName: '轻薄透气运动夹克',
          productDescription: '四面弹力面料 · 防泼水涂层\n适合跑步 · 健身 · 日常通勤',
          originalPrice: '¥599',
          discountPrice: '¥299',
          discountBadge: '5折特惠',
          productImage: '',
          features: [
            '轻量科技面料，重量仅 180g',
            '防泼水处理，应对多变天气',
            '四面弹力，全方位自由活动',
            '多色可选，简约百搭设计',
          ],
          ctaText: '立即抢购',
          primaryColor: '#6366f1',
          accentColor: '#f59e0b',
          backgroundColor: '#1e1b4b',
        }}
      />

      <Composition
        id="SlideVideo"
        component={SlideVideo}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        schema={SlideVideoSchema}
        defaultProps={{
          slides: [
            { text: '新年快乐', imageFile: '' },
            { text: '万事如意', imageFile: '' },
            { text: '心想事成', imageFile: '' },
          ],
          textColor: '#ffffff',
          overlayOpacity: 0.45,
        }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.slides.length * 90,
        })}
      />
    </>
  );
};
