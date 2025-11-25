"use client";

import { useRef } from 'react';
import { Download, Share2, X } from 'lucide-react';

interface ShareStoryCardProps {
  trackName: string;
  artistName: string;
  albumArt: string;
  rating: number;
  review?: string;
  username: string;
  userAvatar?: string;
  onClose: () => void;
}

export function ShareStoryCard({
  trackName,
  artistName,
  albumArt,
  rating,
  review,
  username,
  userAvatar,
  onClose
}: ShareStoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Draw the story card using Canvas API
  const generateImage = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, '#14181c');
    gradient.addColorStop(0.5, '#1a1f26');
    gradient.addColorStop(1, '#14181c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Load and draw album art
    const albumImg = new Image();
    albumImg.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      albumImg.onload = resolve;
      albumImg.onerror = reject;
      albumImg.src = albumArt;
    });

    // Draw album art centered
    const artSize = 640;
    const artX = (1080 - artSize) / 2;
    const artY = 640;
    
    // Rounded rectangle for album art
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(artX, artY, artSize, artSize, 32);
    ctx.clip();
    ctx.drawImage(albumImg, artX, artY, artSize, artSize);
    ctx.restore();

    // Border around album art with rounded corners
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(artX, artY, artSize, artSize, 32);
    ctx.stroke();

    // Logo at top
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 60px system-ui, -apple-system, sans-serif';
    ctx.fillText('MusicBoxd', 96, 140);

    // Track name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 70px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    
    // Word wrap for track name
    const maxWidth = 900;
    const words = trackName.split(' ');
    let line = '';
    let y = 1380;
    
    for (let word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), 540, y);
        line = word + ' ';
        y += 80;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), 540, y);

    // Artist name
    ctx.fillStyle = '#d1d5db';
    ctx.font = '50px system-ui, -apple-system, sans-serif';
    ctx.fillText(artistName, 540, y + 70);

    // Stars
    const starY = y + 150;
    ctx.font = '80px system-ui, -apple-system, sans-serif';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starX = 540 - (2.5 * 100);
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('★', starX, starY);
      } else if (i === fullStars && hasHalfStar) {
        // Draw half star by clipping
        ctx.save();
        ctx.beginPath();
        ctx.rect(starX - 40, starY - 80, 40, 100);
        ctx.clip();
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('★', starX, starY);
        ctx.restore();
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(starX, starY - 80, 40, 100);
        ctx.clip();
        ctx.fillStyle = '#4b5563';
        ctx.fillText('★', starX, starY);
        ctx.restore();
      } else {
        ctx.fillStyle = '#4b5563';
        ctx.fillText('★', starX, starY);
      }
      starX += 100;
    }

    // Review text if exists
    if (review) {
      const reviewY = starY + 80;
      const reviewMaxWidth = 700;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(190, reviewY, reviewMaxWidth, 300);
      
      ctx.fillStyle = '#e5e7eb';
      ctx.font = 'italic 30px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      
      // Word wrap for review
      const reviewWords = review.split(' ');
      let reviewLine = '';
      let reviewLineY = reviewY + 60;
      let lineCount = 0;
      const maxLines = 4;
      
      for (let word of reviewWords) {
        if (lineCount >= maxLines) break;
        
        const testLine = reviewLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > reviewMaxWidth - 100 && reviewLine !== '') {
          ctx.fillText('"' + reviewLine.trim() + '"', 540, reviewLineY);
          reviewLine = word + ' ';
          reviewLineY += 50;
          lineCount++;
        } else {
          reviewLine = testLine;
        }
      }
      
      if (lineCount < maxLines && reviewLine) {
        ctx.fillText('"' + reviewLine.trim() + '"', 540, reviewLineY);
      }
    }

    // User avatar at bottom
    const avatarSize = 80;
    const avatarX = 96;
    const avatarY = 1760;

    if (userAvatar) {
      const avatarImg = new Image();
      avatarImg.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        avatarImg.onload = resolve;
        avatarImg.onerror = resolve;
        avatarImg.src = userAvatar;
      });

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
    } else {
      // Draw gradient circle
      const avatarGradient = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
      avatarGradient.addColorStop(0, '#10b981');
      avatarGradient.addColorStop(1, '#14b8a6');
      
      ctx.fillStyle = avatarGradient;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw initial
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(username.charAt(0).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 12);
    }

    // Username
    ctx.fillStyle = '#d1d5db';
    ctx.font = '500 40px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('@' + username, avatarX + avatarSize + 24, avatarY + avatarSize / 2 + 15);

    // Date
    ctx.fillStyle = '#9ca3af';
    ctx.font = '30px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    const dateStr = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    ctx.fillText(dateStr, 984, avatarY + avatarSize / 2 + 15);

    return canvas.toDataURL('image/png');
  };

  const handleDownload = async () => {
    try {
      console.log('Starting image generation...');
      const dataUrl = await generateImage();
      
      const link = document.createElement('a');
      link.download = `musicboxd-${trackName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      console.log('Download triggered');
    } catch (error) {
      console.error('Error generating image:', error);
      alert(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleShare = async () => {
    try {
      console.log('Starting share process...');
      const dataUrl = await generateImage();
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'musicboxd-review.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${trackName} - ${artistName}`,
            text: `Check out my review on MusicBoxd!`,
          });
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.log('Share failed, falling back to download');
            handleDownload();
          }
        }
      } else {
        console.log('Share not supported, falling back to download');
        handleDownload();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return [...Array(5)].map((_, i) => {
      if (i < fullStars) {
        return <span key={i} className="text-yellow-400">★</span>;
      } else if (i === fullStars && hasHalfStar) {
        return (
          <span key={i} className="relative inline-block">
            <span className="text-gray-600">★</span>
            <span className="absolute left-0 top-0 overflow-hidden text-yellow-400" style={{width: '50%'}}>★</span>
          </span>
        );
      } else {
        return <span key={i} className="text-gray-600">★</span>;
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="relative max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Back button */}
        <button
          onClick={onClose}
          className="absolute -top-10 sm:-top-12 left-0 flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
        >
          <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm sm:text-base">Back</span>
        </button>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-3 sm:mb-4 px-2">
          <button
            onClick={handleDownload}
            className="btn-primary flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            onClick={handleShare}
            className="btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Story Card Preview */}
        <div className="bg-white/10 rounded-lg p-2 sm:p-4 flex justify-center items-center">
          <div className="relative overflow-hidden" style={{ width: 'min(324px, calc(100vw - 32px))', height: 'min(576px, calc((100vw - 32px) * 16 / 9))' }}>
            <div
              ref={cardRef}
              className="absolute top-0 left-0"
              style={{
                width: '1080px',
                height: '1920px',
                transform: `scale(${Math.min(324, window.innerWidth - 32) / 1080})`,
                transformOrigin: 'top left',
              }}
            >
            {/* Card Background */}
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #14181c 0%, #1a1f26 50%, #14181c 100%)'
            }}>
              {/* Subtle pattern overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.05,
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '40px 40px'
              }} />
            </div>

            {/* Content */}
            <div style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '96px'
            }}>
              {/* Logo at top */}
              <div style={{
                position: 'absolute',
                top: '80px',
                left: '96px'
              }}>
                <h1 style={{
                  fontSize: '60px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #34d399 0%, #2dd4bf 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  MusicBoxd
                </h1>
              </div>

              {/* Album Art */}
              <div style={{
                position: 'relative',
                marginBottom: '64px'
              }}>
                <div style={{
                  width: '640px',
                  height: '640px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  border: '8px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <img
                    src={albumArt}
                    alt={trackName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
                
                {/* Gradient overlay on bottom */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '192px',
                  borderRadius: '0 0 24px 24px',
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%)'
                }} />
              </div>

              {/* Track Info */}
              <div style={{
                textAlign: 'center',
                marginBottom: '48px',
                maxWidth: '768px'
              }}>
                <h2 style={{
                  fontSize: '70px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '24px',
                  lineHeight: '1.1',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {trackName}
                </h2>
                <p style={{
                  fontSize: '50px',
                  color: '#d1d5db',
                  marginBottom: '40px'
                }}>
                  {artistName}
                </p>

                {/* Rating */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '48px'
                }}>
                  <div style={{
                    display: 'flex',
                    fontSize: '80px'
                  }}>
                    {renderStars(rating)}
                  </div>
                </div>

                {/* Review */}
                {review && (
                  <div style={{
                    borderRadius: '16px',
                    padding: '48px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <p style={{
                      fontSize: '30px',
                      color: '#e5e7eb',
                      fontStyle: 'italic',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      "{review}"
                    </p>
                  </div>
                )}
              </div>

              {/* User info at bottom */}
              <div style={{
                position: 'absolute',
                bottom: '80px',
                left: '96px',
                right: '96px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
                  }}>
                    {userAvatar ? (
                      <img src={userAvatar} alt={username} style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }} crossOrigin="anonymous" />
                    ) : (
                      <span style={{
                        fontSize: '30px',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '40px',
                    color: '#d1d5db',
                    fontWeight: '500'
                  }}>
                    @{username}
                  </span>
                </div>
                
                <div style={{
                  fontSize: '30px',
                  color: '#9ca3af'
                }}>
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-400 mt-2 sm:mt-4 px-2">
          Perfect size for Instagram, Facebook, and Snapchat stories
        </p>
      </div>
    </div>
  );
}
