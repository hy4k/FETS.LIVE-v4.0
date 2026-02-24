import { GlassCard } from "./iCloud/GlassCard";
import {
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Shield,
} from "lucide-react";

export function PremiumShowcase() {
  return (
    <div
      className="p-8 min-h-screen"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="dashboard-title text-white mb-4">
            Premium Design Showcase
          </h1>
          <p className="dashboard-subtitle text-white/80">
            Experience the new glassmorphic cards, premium typography, and
            micro-interactions
          </p>
        </div>

        {/* Premium KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Card 1 - Primary */}
          <div className="premium-kpi-card">
            <div className="premium-kpi-card__icon premium-kpi-card__icon--primary">
              <Users size={28} />
            </div>
            <div className="premium-kpi-card__value">1,247</div>
            <div className="premium-kpi-card__label">Active Users</div>
            <div className="premium-kpi-card__trend premium-kpi-card__trend--up">
              <TrendingUp size={16} />
              <span>+12.5%</span>
            </div>
          </div>

          {/* Card 2 - Success */}
          <div className="premium-kpi-card">
            <div className="premium-kpi-card__icon premium-kpi-card__icon--success">
              <CheckCircle size={28} />
            </div>
            <div className="premium-kpi-card__value">98.2%</div>
            <div className="premium-kpi-card__label">Success Rate</div>
            <div className="premium-kpi-card__trend premium-kpi-card__trend--up">
              <TrendingUp size={16} />
              <span>+3.1%</span>
            </div>
          </div>

          {/* Card 3 - Warning */}
          <div className="premium-kpi-card">
            <div className="premium-kpi-card__icon premium-kpi-card__icon--warning">
              <Calendar size={28} />
            </div>
            <div className="premium-kpi-card__value">24</div>
            <div className="premium-kpi-card__label">Events Today</div>
            <div className="premium-kpi-card__trend premium-kpi-card__trend--up">
              <TrendingUp size={16} />
              <span>+8</span>
            </div>
          </div>
        </div>

        {/* Glass Cards with Different Variants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <GlassCard elevation="medium">
            <div className="p-4">
              <h3 className="card-title mb-3">Standard Glass Card</h3>
              <p className="text-body text-gray-700">
                This card uses the premium glassmorphic design with frosted blur
                effect and multi-layer shadows. Hover over it to see the
                elevation effect!
              </p>
            </div>
          </GlassCard>

          <GlassCard variant="accent" elevation="high">
            <div className="p-4">
              <h3 className="card-title mb-3">Accent Glow Card</h3>
              <p className="text-body text-gray-700">
                This variant features a purple glow effect on hover. Perfect for
                highlighting featured content or important callouts.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Button Showcase */}
        <div className="mb-12">
          <h2 className="section-title text-white mb-6">Interactive Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-premium-interactive btn-primary-glow btn-md">
              Primary Action
            </button>
            <button className="btn-premium-interactive btn-secondary-glass btn-md">
              Secondary Action
            </button>
            <button className="btn-premium-interactive btn-success-pulse btn-md">
              Success Action
            </button>
            <button className="btn-premium-interactive btn-danger-shake btn-md">
              Danger Action
            </button>
            <button className="btn-icon-bounce">
              <Shield size={20} />
            </button>
          </div>
        </div>

        {/* Typography Showcase */}
        <GlassCard elevation="high">
          <div className="p-8">
            <h2 className="section-title mb-4">Typography System</h2>
            <div className="space-y-6">
              <div>
                <h1 className="text-h1 mb-2">Heading 1 - Space Grotesk</h1>
                <p className="text-sm text-gray-500">
                  67.34px, Weight 800, Gradient Effect
                </p>
              </div>
              <div>
                <h2 className="text-h2 mb-2">Heading 2 - Space Grotesk</h2>
                <p className="text-sm text-gray-500">50.51px, Weight 700</p>
              </div>
              <div>
                <h3 className="text-h3 mb-2">Heading 3 - Space Grotesk</h3>
                <p className="text-sm text-gray-500">37.90px, Weight 700</p>
              </div>
              <div>
                <p className="text-lead">
                  Lead Paragraph - This is a larger body text used for
                  introductions and important content. Inter font with 21.33px
                  size.
                </p>
              </div>
              <div>
                <p className="text-body">
                  Body Text - Standard paragraph text using Inter font at 16px.
                  Optimized for readability with antialiasing and font feature
                  settings for better rendering.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="label label-primary">Primary Label</span>
                <span className="label label-success">Success Label</span>
                <span className="label label-warning">Warning Label</span>
                <span className="label label-danger">Danger Label</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Features List */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="frosted-card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-4">
              <Shield size={32} />
            </div>
            <h4 className="text-h4 mb-2">Glassmorphism</h4>
            <p className="text-small text-gray-600">
              Premium frosted glass effects with 24px blur and saturation boost
            </p>
          </div>

          <div className="frosted-card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-500 text-white mb-4">
              <TrendingUp size={32} />
            </div>
            <h4 className="text-h4 mb-2">Shadow Layering</h4>
            <p className="text-small text-gray-600">
              5-level elevation system with multi-layer shadows for realistic
              depth
            </p>
          </div>

          <div className="frosted-card text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white mb-4">
              <AlertCircle size={32} />
            </div>
            <h4 className="text-h4 mb-2">Micro-interactions</h4>
            <p className="text-small text-gray-600">
              Spring-based animations with ripple, shimmer, and bounce effects
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumShowcase;
