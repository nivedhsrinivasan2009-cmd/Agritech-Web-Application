import React from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle, XCircle, AlertTriangle, Scale, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfUse() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: `By downloading, accessing, or using the Gracia Visitor App ("App"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the App.`
    },
    {
      title: "2. Description of Service",
      content: `The Gracia Visitor App provides information about Gracia Farm, including events, activities, maps, shop information, and an AI-powered assistant. The App is designed to enhance your visit to Gracia Farm.`
    },
    {
      title: "3. User Accounts",
      content: `Some features may require account registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate information and update it as needed.`
    },
    {
      title: "4. Acceptable Use",
      content: `You agree to use the App only for lawful purposes and in accordance with these Terms. You agree not to:

• Use the App in any way that violates applicable laws or regulations
• Attempt to gain unauthorized access to any part of the App
• Interfere with or disrupt the App's functionality
• Use automated systems to access the App without permission
• Impersonate any person or entity
• Collect user information without consent
• Upload malicious code or content`
    },
    {
      title: "5. Intellectual Property",
      content: `All content in the App, including text, graphics, logos, images, and software, is the property of Gracia Farm or its licensors and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without explicit permission.`
    },
    {
      title: "6. User Content",
      content: `If you submit content through the App (such as feedback or AI chat messages), you grant Gracia Farm a non-exclusive, royalty-free license to use, modify, and display that content for the purpose of operating and improving the App.`
    },
    {
      title: "7. AI Assistant",
      content: `The AI assistant provides general information and recommendations. While we strive for accuracy, the AI may occasionally provide incorrect or outdated information. The AI assistant is not a substitute for official staff guidance, especially regarding safety matters.`
    },
    {
      title: "8. Bookings and Reservations",
      content: `Event bookings made through the App are subject to availability and our booking policies. We reserve the right to cancel or modify bookings due to unforeseen circumstances. Refund policies are outlined in our separate Booking Terms.`
    },
    {
      title: "9. Location Services",
      content: `The App may request access to your device's location to provide navigation features. Location data is used only while using the App and is not stored or shared with third parties except as described in our Privacy Policy.`
    },
    {
      title: "10. Disclaimer of Warranties",
      content: `THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.`
    },
    {
      title: "11. Limitation of Liability",
      content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, GRACIA FARM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP.`
    },
    {
      title: "12. Indemnification",
      content: `You agree to indemnify and hold harmless Gracia Farm and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the App or violation of these Terms.`
    },
    {
      title: "13. Changes to Terms",
      content: `We may update these Terms from time to time. We will notify you of significant changes through the App or by email. Continued use of the App after changes constitutes acceptance of the new Terms.`
    },
    {
      title: "14. Termination",
      content: `We reserve the right to suspend or terminate your access to the App at any time for violation of these Terms or for any other reason at our discretion.`
    },
    {
      title: "15. Governing Law",
      content: `These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where Gracia Farm is located, without regard to conflict of law principles.`
    },
    {
      title: "16. Contact Information",
      content: `For questions about these Terms, please contact us at legal@gracia.farm or by mail at 123 Farm Road, Green Valley, Countryside, GV 12345.`
    }
  ];

  const dos = [
    "Use the App to enhance your farm visit",
    "Report any issues or inaccuracies",
    "Respect other visitors and staff",
    "Follow farm rules and guidelines",
    "Keep your account secure"
  ];

  const donts = [
    "Share your account with others",
    "Use the App for commercial purposes without permission",
    "Attempt to reverse-engineer the App",
    "Post offensive or harmful content",
    "Rely solely on AI for safety information"
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
              <Scale className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Use</h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Please read these terms carefully before using the Gracia Visitor App.
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
            <strong>Last Updated:</strong> January 2026 | <strong>Version:</strong> 1.0
          </p>
        </div>

        {/* Quick Summary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">Quick Summary</h3>
                <p className="text-amber-700 text-sm">
                  This is a legal document. By using our App, you agree to follow our rules, respect our
                  intellectual property, and understand that the App is provided as-is. We value your
                  privacy and security.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Do's and Don'ts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid md:grid-cols-2 gap-4"
        >
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Do's</h3>
            </div>
            <ul className="space-y-2">
              {dos.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Don'ts</h3>
            </div>
            <ul className="space-y-2">
              {donts.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Full Terms */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2D5016]" />
            Full Terms
          </h2>
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg border border-stone-100 p-5">
                <h3 className="font-semibold text-stone-900 mb-3">{section.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Links */}
        <div className="mt-8 pt-6 border-t border-stone-200 flex flex-wrap gap-4">
          <Link to="/privacy" className="text-[#2D5016] hover:underline text-sm">
            Privacy Policy
          </Link>
          <Link to="/about" className="text-[#2D5016] hover:underline text-sm">
            About Gracia
          </Link>
        </div>
      </div>
    </div>
  );
}
