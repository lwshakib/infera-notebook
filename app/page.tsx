"use client";
import { FloatingLandingPageNavbar } from "@/components/floating-navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PricingTable } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaBookOpen,
  FaEnvelope,
  FaGithub,
  FaLightbulb,
  FaLinkedin,
  FaRocket,
  FaShieldAlt,
  FaTwitter,
} from "react-icons/fa";

// Icon Components
const PowerStudyIcon = () => (
  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
    <FaLightbulb className="w-8 h-8 text-blue-600 dark:text-blue-400" />
  </div>
);

const OrganizeThinkingIcon = () => (
  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
    <FaBookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
  </div>
);

const SparkIdeasIcon = () => (
  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
    <FaRocket className="w-8 h-8 text-purple-600 dark:text-purple-400" />
  </div>
);

const PrivacyIcon = () => (
  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
    <FaShieldAlt className="w-10 h-10 text-gray-600 dark:text-gray-400" />
  </div>
);

export default function Home() {
  const router = useRouter();
  return (
    <div className="w-full relative">
      <FloatingLandingPageNavbar />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-black dark:text-white">
          Understand{" "}
          <span className="bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            Anything
          </span>
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-8">
          Your research and thinking partner, grounded in the information you
          trust, built with the latest Gemini models.
        </p>
        <Button
          size="lg"
          className="rounded-full font-semibold bg-black text-white dark:bg-white dark:text-black cursor-pointer"
          onClick={() => router.push("/notebooks")}
        >
          Try Infera Notebook
        </Button>
      </div>

      <section className="py-20 px-4" id="features">
        <h1 className="text-4xl font-bold text-center mb-12">
          Your Personalized AI Research Assistant
        </h1>
        <div className="max-w-6xl mx-auto grid gap-16">
          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">Upload your sources</h2>
              <p className="text-lg text-gray-600">
                Upload PDFs, websites, YouTube videos, audio files, Google Docs,
                or Google Slides, and Infera Notebook will summarize them and
                make interesting connections between topics, all powered by
                Gemini 2.0's multimodal understanding capabilities.
              </p>
            </div>
            <div className="md:w-1/2">
              <video
                src="/01.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="rounded-lg shadow-xl w-full h-auto"
              ></video>
            </div>
          </div>

          {/* Feature 2 - Image on left */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">Instant insights</h2>
              <p className="text-lg text-gray-600">
                With all of your sources in place, Infera Notebook gets to work
                and becomes a personalized AI expert in the information that
                matters most to you.
              </p>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/02.png"
                alt="Instant Insights"
                width={500}
                height={300}
                className="rounded-lg shadow-xl w-full h-auto"
              />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">
                See the source, not just the answer
              </h2>
              <p className="text-lg text-gray-600">
                Gain confidence in every response because Infera Notebook
                provides clear citations for its work, showing you the exact
                quotes from your sources.
              </p>
            </div>
            <div className="md:w-1/2">
              <video
                src="/03.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="rounded-lg shadow-xl w-full h-auto"
              ></video>
            </div>
          </div>

          {/* Feature 4 - Video on left */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">
                Listen and learn on the go
              </h2>
              <p className="text-lg text-gray-600">
                Our new Audio Overview feature can turn your sources into
                engaging "Deep Dive" discussions with one click.
              </p>
            </div>
            <div className="md:w-1/2">
              <video
                src="/04.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="rounded-lg shadow-xl w-full h-auto"
              ></video>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            How people are using Infera Notebook
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <PowerStudyIcon />
              <h3 className="text-2xl font-bold mt-6 mb-2">Power study</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload lecture recordings, textbook chapters, and research
                papers. Ask Infera Notebook to explain complex concepts in
                simple terms, provide real-world examples, and reinforce your
                understanding.
              </p>
              <p className="font-semibold">Learn faster and deeper.</p>
            </div>
            <div className="flex flex-col items-center">
              <OrganizeThinkingIcon />
              <h3 className="text-2xl font-bold mt-6 mb-2">
                Organize your thinking
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload your source material and let Infera Notebook create a
                polished presentation outline, complete with key talking points
                and supporting evidence.
              </p>
              <p className="font-semibold">Present with confidence.</p>
            </div>
            <div className="flex flex-col items-center">
              <SparkIdeasIcon />
              <h3 className="text-2xl font-bold mt-6 mb-2">Spark new ideas</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload brainstorming notes, market research, and competitor
                research. Ask Infera Notebook to identify trends, generate new
                product ideas, and uncover hidden opportunities.
              </p>
              <p className="font-semibold">Unlock your creative potential.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            We value your privacy and do not use your personal data to train
            Infera Notebook.
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
            Infera Notebook does not use your personal data, including your
            source uploads, queries, and the responses from the model for
            training.
          </p>
          <div className="flex justify-center">
            <PrivacyIcon />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-1"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>
                What file types does Infera Notebook support?
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <p>
                  Infera Notebook supports a wide range of file formats
                  including PDFs, Word documents, PowerPoint presentations, text
                  files, and even YouTube videos and audio files. We also
                  support direct website URLs and Google Docs integration.
                </p>
                <p>
                  Our AI can process and understand content from these sources,
                  making connections and providing insights across all your
                  uploaded materials.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>
                How does Infera Notebook protect my privacy?
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <p>
                  Your privacy is our top priority. Infera Notebook does not use
                  your personal data, including your source uploads, queries,
                  and AI responses for training our models. Your data remains
                  private and secure.
                </p>
                <p>
                  We implement enterprise-grade security measures and comply
                  with international data protection regulations to ensure your
                  information is always protected.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>
                Can I use Infera Notebook for academic research?
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <p>
                  Absolutely! Infera Notebook is perfect for academic research.
                  Upload your research papers, lecture notes, and academic
                  sources to get instant summaries, identify key themes, and
                  discover connections between different research areas.
                </p>
                <p>
                  The AI provides clear citations from your sources, making it
                  easy to trace back to original materials for your academic
                  work.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>
                How accurate are the AI responses?
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <p>
                  Infera Notebook uses the latest Gemini 2.0 models with
                  multimodal understanding capabilities, providing highly
                  accurate responses based on your uploaded sources. The AI
                  always cites specific quotes and passages from your materials.
                </p>
                <p>
                  You can verify every response by checking the provided
                  citations, ensuring transparency and accuracy in all
                  AI-generated insights.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>
                What makes Infera Notebook different from other AI tools?
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <p>
                  Unlike generic AI tools, Infera Notebook is specifically
                  designed to work with your trusted sources. It doesn't rely on
                  general internet knowledge but instead builds expertise from
                  the materials you upload.
                </p>
                <p>
                  This approach ensures responses are grounded in your specific
                  information, providing more relevant and accurate insights for
                  your unique research needs.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="py-20 px-4" id="plans">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            Start with our free plan and upgrade as your research needs grow.
            All plans include our core AI features with different usage limits.
          </p>
          <div className="flex justify-center">
            <PricingTable />
          </div>
        </div>
      </section>

      <section
        className="py-20 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        id="contact"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Get in Touch
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Have questions about Infera Notebook? We'd love to hear from you.
              Reach out and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="max-w-2xl w-full">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Email Card */}
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <FaEnvelope className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                      Email
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                      leadwithshakib@gmail.com
                    </p>
                    <div className="mt-4">
                      <a
                        href="mailto:leadwithshakib@gmail.com"
                        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                      >
                        Send Email
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* X (Twitter) Card */}
                <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <FaTwitter className="w-8 h-8 text-white dark:text-gray-900" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                      X (Twitter)
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                      @lwshakib
                    </p>
                    <div className="mt-4">
                      <a
                        href="https://twitter.com/lwshakib"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200"
                      >
                        Follow on X
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Product
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="#features"
                    className="text-base text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#plans"
                    className="text-base text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    Plans
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-base text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Company
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-base text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-base text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-base text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Legal
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-base text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-base text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Connect
              </h3>
              <div className="flex space-x-6">
                <Link
                  href="#"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
                  aria-label="Twitter"
                >
                  <FaTwitter className="h-6 w-6" />
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
                  aria-label="GitHub"
                >
                  <FaGithub className="h-6 w-6" />
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <Image
                  src="/logo.svg"
                  alt="Infera Notebook Logo"
                  width={32}
                  height={32}
                  className="dark:invert"
                />
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  Infera Notebook
                </span>
              </div>
              <p className="text-base text-gray-400">
                &copy; {new Date().getFullYear()} Infera. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
