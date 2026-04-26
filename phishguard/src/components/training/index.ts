/**
 * Training Gamification Components
 *
 * Points, Badges, and Leaderboard for the training UI.
 * Wave C.6 of the PhishGuard Master Plan.
 */

// Points Display - shows current points, level progress bar, next level threshold
export {
  PointsDisplay,
  MiniPointsBadge,
  getLevelFromPoints,
  getNextLevelThreshold,
  getPointsToNextLevel,
  getLevelProgress,
  LEVEL_THRESHOLDS,
  type PointsDisplayProps,
} from './PointsDisplay'

// Badge Grid - earned badges + locked badges with descriptions
export {
  BadgeGrid,
  MiniBadgePreview,
  BADGE_CATALOG,
  type Badge,
  type BadgeGridProps,
  type BadgeType,
} from './BadgeGrid'

// Leaderboard Table - rankings within organization
export {
  LeaderboardTable,
  CompactLeaderboard,
  type LeaderboardEntry,
  type LeaderboardTableProps,
} from './LeaderboardTable'