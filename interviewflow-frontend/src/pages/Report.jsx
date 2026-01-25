import { useLocation, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  Trophy,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Download,
  Share2,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react'
import { Button, Badge, Progress } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { TRANSITIONS } from '@/lib/constants'
import { cn, staggerDelay } from '@/lib/utils'

export function Report() {
  const location = useLocation()
  const navigate = useNavigate()
  const reportRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const responses = location.state?.responses || []
  const interviewId = location.state?.interviewId || null

  // Calculate aggregate scores
  const aggregateScores = responses.reduce(
    (acc, r) => {
      if (r.result?.scores) {
        acc.clarity += r.result.scores.clarity
        acc.coherence += r.result.scores.coherence
        acc.depth += r.result.scores.depth
        acc.communication += r.result.scores.communication
        acc.count++
      }
      return acc
    },
    { clarity: 0, coherence: 0, depth: 0, communication: 0, count: 0 }
  )

  const avgScores = aggregateScores.count
    ? {
        clarity: Math.round(aggregateScores.clarity / aggregateScores.count),
        coherence: Math.round(aggregateScores.coherence / aggregateScores.count),
        depth: Math.round(aggregateScores.depth / aggregateScores.count),
        communication: Math.round(aggregateScores.communication / aggregateScores.count),
      }
    : { clarity: 78, coherence: 82, depth: 75, communication: 85 } // Demo data

  const overallScore = Math.round(
    (avgScores.clarity + avgScores.coherence + avgScores.depth + avgScores.communication) / 4
  )

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-semantic-success'
    if (score >= 70) return 'text-accent-primary'
    if (score >= 55) return 'text-semantic-warning'
    return 'text-semantic-error'
  }

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 55) return 'Needs Work'
    return 'Needs Improvement'
  }

  /**
   * Export report as PDF
   */
  const handleExportPDF = async () => {
    if (!reportRef.current) {
      alert('Report content not found. Please refresh the page and try again.');
      return;
    }
    
    setIsExporting(true);
    try {
      // Dynamically import libraries
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf').catch(() => {
          throw new Error('jspdf library not installed. Please run: npm install jspdf html2canvas');
        }),
        import('html2canvas').catch(() => {
          throw new Error('html2canvas library not installed. Please run: npm install jspdf html2canvas');
        })
      ]);

      // Wait for fonts and images to load
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the element
      const element = reportRef.current;
      
      // Scroll element into view to ensure it's rendered
      element.scrollIntoView({ behavior: 'instant', block: 'start' });
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Add PDF exporting class to body
      document.body.classList.add('pdf-exporting');
      
      // Wait for styles to apply
      await new Promise(resolve => setTimeout(resolve, 200));

      // Hide action buttons
      const actionSection = element.querySelector('[data-pdf-exclude]');
      if (actionSection) {
        actionSection.style.display = 'none';
      }

      // Get actual element dimensions
      const rect = element.getBoundingClientRect();
      const elementHeight = element.scrollHeight;
      const elementWidth = element.scrollWidth;

      // Capture with improved options
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: elementWidth,
        height: elementHeight,
        windowWidth: elementWidth,
        windowHeight: elementHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Ensure all styles are applied in the cloned document
          const clonedElement = clonedDoc.querySelector('.pdf-root');
          if (clonedElement) {
            clonedElement.style.width = `${elementWidth}px`;
            clonedElement.style.height = 'auto';
            clonedElement.style.overflow = 'visible';
            // Hide any scrollbars
            clonedElement.style.overflowX = 'hidden';
            clonedElement.style.overflowY = 'hidden';
          }
        }
      });

      // Restore action buttons
      if (actionSection) {
        actionSection.style.display = '';
      }

      // Remove PDF exporting class
      document.body.classList.remove('pdf-exporting');

      // Verify canvas has content
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to capture report content. The canvas is empty.');
      }

      // Check if canvas actually has content (not just white/transparent)
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
      const hasContent = imageData.data.some((channel, index) => {
        // Check every 4th value (alpha channel) or any non-white pixel
        return index % 4 === 3 ? channel > 0 : channel < 250;
      });

      if (!hasContent) {
        throw new Error('Failed to capture report content. The captured image appears to be blank.');
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      // A4 dimensions in mm
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 5; // Small margin

      // Calculate image dimensions to fit page width
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add first page
      let yPosition = margin;
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        // Calculate how much we can fit on this page
        const availableHeight = pageHeight - (margin * 2);
        const heightToAdd = Math.min(remainingHeight, availableHeight);
        
        // Calculate source crop for this page
        const sourceHeight = (heightToAdd / imgHeight) * canvas.height;
        
        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext('2d');
        
        // Draw the slice
        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,  // Source
          0, 0, canvas.width, sourceHeight         // Destination
        );
        
        const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
        
        // Add to PDF
        if (yPosition > margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.addImage(pageImgData, 'PNG', margin, yPosition, imgWidth, heightToAdd);
        
        // Update for next iteration
        sourceY += sourceHeight;
        remainingHeight -= heightToAdd;
        yPosition += heightToAdd;
      }

      // Save PDF
      const filename = `InterviewReport_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert(`Failed to export PDF: ${error.message}\n\nPlease ensure:\n1. The page is fully loaded\n2. You have jspdf and html2canvas installed\n3. Your browser supports canvas operations`);
    } finally {
      // Ensure PDF exporting class is removed even on error
      document.body.classList.remove('pdf-exporting');
      setIsExporting(false);
    }
  }

  /**
   * Share report (using Web Share API or copy link)
   */
  const handleShare = async () => {
    try {
      const shareData = {
        title: 'Interview Report - InterviewFlow AI',
        text: `I completed an interview with an overall score of ${overallScore}/100. Check out my performance breakdown!`,
        url: window.location.href
      };

      // Try Web Share API first (mobile/desktop with share support)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }

      // Fallback: Copy link to clipboard
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      // User cancelled share or clipboard failed
      if (error.name !== 'AbortError') {
        console.error('Share Error:', error);
        // Fallback: Show share options
        const shareText = `Interview Report - Overall Score: ${overallScore}/100\n${window.location.href}`;
        try {
          await navigator.clipboard.writeText(shareText);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        } catch (clipboardError) {
          alert('Unable to share. Please copy the URL manually: ' + window.location.href);
        }
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 pdf-root" ref={reportRef} style={{ minHeight: '100vh' }}>
      {/* Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TRANSITIONS.slow}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-accent-primaryMuted flex items-center justify-center">
            <Trophy className="w-6 h-6 text-accent-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-text-primary">
              Interview Complete
            </h1>
            <p className="text-text-secondary text-sm">
              Here's your performance analysis
            </p>
          </div>
        </div>
      </motion.div>

      {/* Overall Score Card */}
      <motion.section
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...TRANSITIONS.smooth }}
      >
        <GlassCard variant="bordered" glow className="text-center py-14 px-10 rounded-3xl border border-emerald-100 glass-card">
          <div className="mb-5 flex items-baseline justify-center gap-2">
            <span className="text-7xl font-bold text-accent-primary leading-none">{overallScore}</span>
            <span className="text-3xl text-text-muted leading-none">/100</span>
          </div>
          <Badge
            variant={overallScore >= 70 ? 'success' : 'warning'}
            className="text-sm mb-5"
          >
            {getScoreLabel(overallScore)}
          </Badge>
          <p className="text-text-secondary max-w-md mx-auto text-base leading-relaxed">
            {overallScore >= 80
              ? 'Strong performance! You demonstrated excellent communication and technical knowledge.'
              : overallScore >= 65
                ? 'Good foundation with room for improvement. Focus on depth and examples.'
                : 'Keep practicing! Review the feedback below for specific areas to improve.'}
          </p>
        </GlassCard>
      </motion.section>

      {/* Metrics Grid */}
      <motion.section
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...TRANSITIONS.smooth }}
      >
        <h2 className="font-serif text-lg font-semibold text-text-primary mb-4">
          Performance Breakdown
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(avgScores).map(([metric, score], index) => (
            <motion.div
              key={metric}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: staggerDelay(index) }}
            >
              <GlassCard hover padding="md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-secondary capitalize text-sm font-medium">
                    {metric}
                  </span>
                  <span className={cn('text-xl font-semibold', getScoreColor(score))}>
                    {score}%
                  </span>
                </div>
                <Progress
                  value={score}
                  variant={score >= 70 ? 'success' : 'warning'}
                  className="h-3"
                />
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <motion.section
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, ...TRANSITIONS.smooth }}
        >
          <GlassCard padding="md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-semantic-successMuted flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-semantic-success" />
              </div>
              <h3 className="font-medium text-text-primary leading-none">Strengths</h3>
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-semantic-success flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" fill="currentColor" />
                </div>
                <span className="text-sm text-text-secondary leading-relaxed">
                  Clear articulation of complex technical concepts
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-semantic-success flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" fill="currentColor" />
                </div>
                <span className="text-sm text-text-secondary leading-relaxed">
                  Structured approach to problem decomposition
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-semantic-success flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" fill="currentColor" />
                </div>
                <span className="text-sm text-text-secondary leading-relaxed">
                  Good awareness of trade-offs and considerations
                </span>
              </li>
            </ul>
          </GlassCard>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, ...TRANSITIONS.smooth }}
        >
          <GlassCard padding="md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-semantic-warningMuted flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-semantic-warning" />
              </div>
              <h3 className="font-medium text-text-primary leading-none">Areas to Improve</h3>
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-semantic-warning flex-shrink-0" />
                <span className="text-sm text-text-secondary leading-relaxed">
                  Include more real-world examples from experience
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-semantic-warning flex-shrink-0" />
                <span className="text-sm text-text-secondary leading-relaxed">
                  Practice time-boxing responses for efficiency
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-semantic-warning flex-shrink-0" />
                <span className="text-sm text-text-secondary leading-relaxed">
                  Anticipate and address follow-up questions proactively
                </span>
              </li>
            </ul>
          </GlassCard>
        </motion.section>
      </div>

      {/* Question History */}
      {responses.length > 0 && (
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...TRANSITIONS.smooth }}
        >
          <h2 className="font-serif text-lg font-semibold text-text-primary mb-4">
            Question History
          </h2>
          <div className="space-y-3">
            {responses.map((response, index) => (
              <GlassCard key={index} hover padding="md" className="break-inside-avoid">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="mb-2">
                      Question {index + 1}
                    </Badge>
                    <p className="text-text-primary font-medium text-sm mb-2 leading-relaxed">
                      {response.question?.text}
                    </p>
                    <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap break-words">
                      {response.answer}
                    </p>
                  </div>
                  {response.result?.scores && (
                    <div className="text-right flex-shrink-0">
                      <span
                        className={cn(
                          'text-xl font-semibold',
                          getScoreColor(response.result.scores.overall)
                        )}
                      >
                        {response.result.scores.overall}%
                      </span>
                    </div>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.section>
      )}

      {/* Actions */}
      <motion.section
        className="pb-8"
        data-pdf-exclude
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...TRANSITIONS.smooth }}
      >
        <GlassCard variant="default" className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleShare}
            >
              {shareCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </Button>
          </div>
          <Button size="lg" asChild>
            <Link to="/setup">
              Practice Again
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </GlassCard>
      </motion.section>
    </div>
  )
}

export default Report
