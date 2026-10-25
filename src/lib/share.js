// Share Functionality for Gracia Visitor App
import { toast } from 'sonner';

// Check if Web Share API is supported
export function isShareSupported() {
  return navigator.share !== undefined;
}

// Check if sharing files is supported
export function isFileShareSupported() {
  return navigator.canShare !== undefined;
}

// Share content using Web Share API or fallback
export async function share(options) {
  const {
    title = 'Gracia Farm',
    text = '',
    url = window.location.href,
    files = null
  } = options;

  // Use Web Share API if available
  if (isShareSupported()) {
    try {
      const shareData = { title, text, url };

      // Add files if supported
      if (files && isFileShareSupported()) {
        if (navigator.canShare({ files })) {
          shareData.files = files;
        }
      }

      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled - not an error
        return { success: false, cancelled: true };
      }
      console.warn('Native share failed:', error);
    }
  }

  // Fallback to clipboard
  return copyToClipboard(url);
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    toast.success('Link copied to clipboard!');
    return { success: true, method: 'clipboard' };
  } catch (error) {
    toast.error('Failed to copy link');
    return { success: false, error };
  }
}

// Share to specific platform
export function shareToplatform(platform, options) {
  const { title = 'Gracia Farm', text = '', url = window.location.href } = options;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text || title);
  const encodedTitle = encodeURIComponent(title);

  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
    sms: `sms:?body=${encodedText}%20${encodedUrl}`
  };

  const shareUrl = shareUrls[platform];
  if (!shareUrl) {
    console.error(`Unknown platform: ${platform}`);
    return false;
  }

  // Open in new window for social platforms
  if (['email', 'sms'].includes(platform)) {
    window.location.href = shareUrl;
  } else {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  return true;
}

// Share event
export function shareEvent(event) {
  const text = `Check out "${event.title}" at Gracia Farm!`;
  const url = `${window.location.origin}/events/${event.id}`;

  return share({
    title: event.title,
    text,
    url
  });
}

// Share activity
export function shareActivity(activity) {
  const text = `Discover "${activity.title}" at Gracia Farm!`;
  const url = `${window.location.origin}/activities/${activity.id}`;

  return share({
    title: activity.title,
    text,
    url
  });
}

// Share shop
export function shareShop(shop) {
  const text = `Visit ${shop.name} at Gracia Farm!`;
  const url = `${window.location.origin}/shops/${shop.id}`;

  return share({
    title: shop.name,
    text,
    url
  });
}

// Share zone
export function shareZone(zone) {
  const text = `Explore the ${zone.zone_name} at Gracia Farm!`;
  const url = `${window.location.origin}/map?zone=${zone.id}`;

  return share({
    title: zone.zone_name,
    text,
    url
  });
}

// Share app
export function shareApp() {
  return share({
    title: 'Gracia Visitor App',
    text: 'Plan your perfect visit to Gracia Farm with our digital companion app!',
    url: window.location.origin
  });
}

// Generate QR code URL for sharing
export function getQRCodeUrl(url, size = 200) {
  const encodedUrl = encodeURIComponent(url || window.location.href);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;
}

// React hook for sharing
import { useState, useCallback } from 'react';

export function useShare() {
  const [isSharing, setIsSharing] = useState(false);

  const shareContent = useCallback(async (options) => {
    setIsSharing(true);
    try {
      return await share(options);
    } finally {
      setIsSharing(false);
    }
  }, []);

  return {
    share: shareContent,
    shareEvent,
    shareActivity,
    shareShop,
    shareZone,
    shareApp,
    shareToPlatform: shareToplatform,
    copyToClipboard,
    isShareSupported: isShareSupported(),
    isSharing,
    getQRCodeUrl
  };
}

export default {
  share,
  shareToplatform,
  shareEvent,
  shareActivity,
  shareShop,
  shareZone,
  shareApp,
  copyToClipboard,
  isShareSupported,
  isFileShareSupported,
  getQRCodeUrl,
  useShare
};
