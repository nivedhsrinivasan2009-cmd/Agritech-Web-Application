import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Info, Leaf, Users, Clock, Phone, Mail, MapPin,
  Instagram, Facebook, Twitter, ChevronDown, ChevronUp,
  AlertCircle, HelpCircle, Heart, Sprout, Sun, TreePine, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function About() {
  const ecosystemItems = [
    {
      icon: Sprout,
      title: "Sustainable Farming",
      description: "We practice regenerative agriculture to nurture the land for future generations."
    },
    {
      icon: Users,
      title: "Community Hub",
      description: "A gathering space for families, schools, and entrepreneurs to learn and grow together."
    },
    {
      icon: Heart,
      title: "Education & Wellness",
      description: "Programs designed to reconnect people with nature and promote holistic well-being."
    },
    {
      icon: Sun,
      title: "Renewable Energy",
      description: "Our operations are powered by solar and other sustainable energy sources."
    }
  ];

  const faqs = [
    {
      question: "What are your opening hours?",
      answer: "We are open daily from 8:00 AM to 6:00 PM. Some events and activities may have different timings, so please check the Events page for specific schedules."
    },
    {
      question: "Is parking available?",
      answer: "Yes! We have free parking for all visitors. Follow the signs to our main parking area near the entrance."
    },
    {
      question: "Are pets allowed?",
      answer: "Service animals are welcome. For the safety of our farm animals, we ask that other pets remain at home or in your vehicle."
    },
    {
      question: "Do I need to book in advance?",
      answer: "General visits don't require booking. However, some workshops, guided tours, and special events may require registration. Check our Events page for details."
    },
    {
      question: "Is the venue accessible?",
      answer: "Yes, we strive to make Gracia accessible to all visitors. Most pathways are wheelchair-friendly, and accessible facilities are available throughout the venue."
    },
    {
      question: "Can I host a private event?",
      answer: "Absolutely! We offer venue hire for corporate events, private celebrations, and educational programs. Contact us for more information."
    }
  ];

  const guidelines = [
    "Please stay on designated paths and respect fenced areas",
    "Do not feed animals unless supervised by our staff",
    "Dispose of waste in provided bins and help keep our spaces clean",
    "Photography is welcome for personal use",
    "Children must be supervised at all times",
    "Please respect other visitors and maintain a peaceful atmosphere"
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
              <Leaf className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">About Gracia</h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              A sustainable farm and visitor centre dedicated to reconnecting 
              communities with nature, food, and each other.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Our Story */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Our Story</h2>
          <div className="prose prose-stone max-w-none">
            <p className="text-stone-600 leading-relaxed mb-4">
              Gracia was founded with a simple vision: to create a space where people 
              can experience the beauty of sustainable living while learning about 
              where their food comes from. What started as a small family farm has 
              grown into a thriving ecosystem that welcomes thousands of visitors each year.
            </p>
            <p className="text-stone-600 leading-relaxed">
              Today, Gracia serves as a hub for education, wellness, and community 
              building. From our organic greenhouses to our animal sanctuary, every 
              corner of our venue tells a story of respect for the land and commitment 
              to sustainable practices.
            </p>
          </div>
        </motion.section>

        {/* The Ecosystem */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-stone-900 mb-6">The Gracia Ecosystem</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ecosystemItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-5 border border-stone-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#2D5016]/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#2D5016]" />
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-stone-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Visitor Guidelines */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Visitor Guidelines</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm">
                To ensure a safe and enjoyable experience for all visitors, please observe the following guidelines:
              </p>
            </div>
            <ul className="space-y-2">
              {guidelines.map((guideline, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-2" />
                  {guideline}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* FAQs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#2D5016]" />
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-white rounded-xl border border-stone-100 px-4"
              >
                <AccordionTrigger className="text-left font-medium text-stone-900 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-stone-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.section>

        {/* Contact Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-stone-900 mb-6">Get in Touch</h2>
          <div className="bg-white rounded-xl border border-stone-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <h4 className="font-medium text-stone-900 mb-1">Address</h4>
                  <p className="text-sm text-stone-600">
                    123 Farm Road, Green Valley<br />
                    Countryside, GV 12345
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <h4 className="font-medium text-stone-900 mb-1">Opening Hours</h4>
                  <p className="text-sm text-stone-600">
                    Daily: 8:00 AM - 6:00 PM<br />
                    Last entry: 5:00 PM
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <h4 className="font-medium text-stone-900 mb-1">Phone</h4>
                  <p className="text-sm text-stone-600">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <h4 className="font-medium text-stone-900 mb-1">Email</h4>
                  <p className="text-sm text-stone-600">hello@gracia.farm</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="border-t border-stone-100 pt-6">
              <h4 className="font-medium text-stone-900 mb-3">Follow Us</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-[#2D5016] hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-[#2D5016] hover:text-white transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-[#2D5016] hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Staff Portal Link */}
            <div className="border-t border-stone-100 pt-6 mt-6">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Staff Portal
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}