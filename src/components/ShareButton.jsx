// Share Button Component
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Copy, MessageCircle, Facebook, Twitter, Linkedin,
  Mail, Send, X, Check, QrCode
} from 'lucide-react';
import { Button } from './ui/button';
import { useShare, getQRCodeUrl } from '@/lib/share';

const PLATFORMS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'telegram', name: 'Telegram', icon: Send, color: '#0088CC' },
  { id: 'email', name: 'Email', icon: Mail, color: '#EA4335' }
];

export default function ShareButton({
  title,
  text,
  url,
  variant = 'default',
  size = 'default',
  showLabel = true,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { share, shareToPlatform, copyToClipboard, isShareSupported } = useShare();

  const shareUrl = url || window.location.href;

  const handleNativeShare = async () => {
    const result = await share({ title, text, url: shareUrl });
    if (result.success) {
      setIsOpen(false);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlatformShare = (platformId) => {
    shareToPlatform(platformId, { title, text, url: shareUrl });
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={() => isShareSupported ? handleNativeShare() : setIsOpen(true)}
      >
        <Share2 className="w-4 h-4" />
        {showLabel && 'Share'}
      </Button>

      {/* Share Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-stone-900">Share</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              {/* Content Preview */}
              {(title || text) && (
                <div className="bg-stone-50 rounded-lg p-4 mb-6">
                  {title && (
                    <h4 className="font-medium text-stone-900 mb-1">{title}</h4>
                  )}
                  {text && (
                    <p className="text-sm text-stone-600">{text}</p>
                  )}
                </div>
              )}

              {/* Share Platforms */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handlePlatformShare(platform.id)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${platform.color}20` }}
                      >
                        <Icon
                          className="w-6 h-6"
                          style={{ color: platform.color }}
                        />
                      </div>
                      <span className="text-xs text-stone-600">{platform.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Copy Link */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-stone-100 rounded-lg px-4 py-3 text-sm text-stone-600 truncate">
                  {shareUrl}
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* QR Code Toggle */}
              <button
                onClick={() => setShowQR(!showQR)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                {showQR ? 'Hide QR Code' : 'Show QR Code'}
              </button>

              {/* QR Code */}
              <AnimatePresence>
                {showQR && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex justify-center pt-4">
                      <img
                        src={getQRCodeUrl(shareUrl, 200)}
                        alt="QR Code"
                        className="w-48 h-48 rounded-lg bg-white p-2 shadow-sm"
                      />
                    </div>
                    <p className="text-center text-xs text-stone-500 mt-2">
                      Scan to open on another device
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Compact share icon button
export function ShareIconButton({ title, text, url, className = '' }) {
  const { share, isShareSupported } = useShare();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleShare = async () => {
    if (isShareSupported) {
      await share({ title, text, url });
    } else {
      // Fallback - just copy
      await navigator.clipboard.writeText(url || window.location.href);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className={`p-2 hover:bg-stone-100 rounded-lg transition-colors ${className}`}
        title="Share"
      >
        <Share2 className="w-5 h-5 text-stone-500" />
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
          >
            Link copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
