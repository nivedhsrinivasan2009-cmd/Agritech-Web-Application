import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, UserCheck, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Information You Provide",
          text: "When you create an account, we collect your name and email address. For event bookings, we may collect additional contact information."
        },
        {
          subtitle: "Automatically Collected Information",
          text: "We collect usage data such as pages visited, features used, and interaction patterns to improve our services. This data is anonymized and aggregated."
        },
        {
          subtitle: "Location Data",
          text: "With your permission, we may collect location data to provide navigation features within Gracia Farm. You can disable this in your device settings at any time."
        }
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Service Delivery",
          text: "To provide and maintain our visitor app, process bookings, and send you relevant notifications about events and activities."
        },
        {
          subtitle: "Improvement",
          text: "To analyze usage patterns and improve our app features, content, and user experience."
        },
        {
          subtitle: "Communication",
          text: "To send you important updates, respond to inquiries, and provide customer support."
        }
      ]
    },
    {
      icon: Shield,
      title: "Data Protection",
      content: [
        {
          subtitle: "Security Measures",
          text: "We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your data."
        },
        {
          subtitle: "Data Retention",
          text: "We retain your personal data only as long as necessary to provide our services. You can request deletion of your data at any time."
        },
        {
          subtitle: "Third-Party Sharing",
          text: "We do not sell your personal information. We may share data with service providers who assist in operating our app, under strict confidentiality agreements."
        }
      ]
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      content: [
        {
          subtitle: "Access & Portability",
          text: "You have the right to access your personal data and request a copy in a portable format."
        },
        {
          subtitle: "Correction & Deletion",
          text: "You can update your information through your profile or request deletion of your account and associated data."
        },
        {
          subtitle: "Opt-Out",
          text: "You can opt out of marketing communications and disable non-essential data collection through app settings."
        }
      ]
    },
    {
      icon: Lock,
      title: "Children's Privacy",
      content: [
        {
          subtitle: "Age Restrictions",
          text: "Our app is designed for general audiences. We do not knowingly collect personal information from children under 13 without parental consent."
        },
        {
          subtitle: "Parental Controls",
          text: "Parents or guardians can contact us to review, update, or delete their child's information."
        },
        {
          subtitle: "COPPA Compliance",
          text: "We comply with the Children's Online Privacy Protection Act (COPPA) and similar regulations worldwide."
        }
      ]
    }
  ];

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2D5016] to-[#4A7C23] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Your privacy matters to us. Learn how we collect, use, and protect your information.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link to="/about" className="inline-flex items-center gap-2 text-[#2D5016] hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to About
        </Link>

        {/* Last Updated */}
        <div className="bg-stone-100 rounded-lg px-4 py-3 mb-8">
          <p className="text-sm text-stone-600">
            <strong>Last Updated:</strong> January 2026 | <strong>Effective Date:</strong> January 1, 2026
          </p>
        </div>

        {/* Introduction */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-stone-600 leading-relaxed">
            Gracia Farm ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use our Gracia
            Visitor App. Please read this policy carefully. By using the app, you consent to the practices
            described in this policy.
          </p>
        </motion.section>

        {/* Sections */}
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.section
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#2D5016]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#2D5016]" />
                </div>
                <h2 className="text-xl font-bold text-stone-900">{section.title}</h2>
              </div>
              <div className="space-y-4 pl-13">
                {section.content.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-stone-100 p-4">
                    <h3 className="font-semibold text-stone-900 mb-2">{item.subtitle}</h3>
                    <p className="text-stone-600 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          );
        })}

        {/* Contact Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#2D5016]/5 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-[#2D5016]" />
            <h2 className="text-xl font-bold text-stone-900">Contact Us</h2>
          </div>
          <p className="text-stone-600 mb-4">
            If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> privacy@gracia.farm</p>
            <p><strong>Address:</strong> 123 Farm Road, Green Valley, Countryside, GV 12345</p>
            <p><strong>Phone:</strong> +1 (555) 123-4567</p>
          </div>
        </motion.section>

        {/* Links */}
        <div className="mt-8 pt-6 border-t border-stone-200 flex flex-wrap gap-4">
          <Link to="/terms" className="text-[#2D5016] hover:underline text-sm">
            Terms of Use
          </Link>
          <Link to="/about" className="text-[#2D5016] hover:underline text-sm">
            About Gracia
          </Link>
        </div>
      </div>
    </div>
  );
}
