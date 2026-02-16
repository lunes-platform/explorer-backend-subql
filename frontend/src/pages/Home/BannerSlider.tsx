import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import styles from './BannerSlider.module.css';
import { API_BASE_URL } from '../../config';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  gradient?: string;
  linkUrl?: string;
  linkLabel?: string;
}

const API_BASE = API_BASE_URL;
const AUTO_PLAY_INTERVAL = 6000;

const BannerSlider: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/banners`)
      .then(res => res.json())
      .then((data: Banner[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % Math.max(banners.length, 1));
    }, AUTO_PLAY_INTERVAL);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length > 1) startAutoPlay();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length, startAutoPlay]);

  const goTo = (index: number) => {
    setCurrent(index);
    startAutoPlay();
  };

  const goNext = () => goTo((current + 1) % banners.length);
  const goPrev = () => goTo((current - 1 + banners.length) % banners.length);

  if (loading || banners.length === 0) return null;

  const banner = banners[current];
  const bg = banner.gradient || 'linear-gradient(135deg, #1a0533 0%, #2d1b69 40%, #0d1520 100%)';

  return (
    <div>
      <div className={styles.sliderContainer}>
        <div className={styles.slide} style={{ background: bg }}>
          {banner.imageUrl && (
            <img src={banner.imageUrl} alt="" className={styles.slideImage} />
          )}
          <div className={styles.slideContent}>
            <h3 className={styles.slideTitle}>{banner.title}</h3>
            {banner.subtitle && (
              <p className={styles.slideSubtitle}>{banner.subtitle}</p>
            )}
            {banner.linkUrl && (
              <Link to={banner.linkUrl} className={styles.slideLink}>
                {banner.linkLabel || 'Learn More'} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {banners.length > 1 && (
          <>
            <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={goPrev} aria-label="Previous">
              <ChevronLeft size={18} />
            </button>
            <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={goNext} aria-label="Next">
              <ChevronRight size={18} />
            </button>

            <div className={styles.dots}>
              {banners.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === current ? styles.active : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BannerSlider;
