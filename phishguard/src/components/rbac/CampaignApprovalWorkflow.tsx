import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import {
  type Role,
  hasPermission,
  CAMPAIGN_APPROVAL_REQUIRED_ADMINS,
} from '@/lib/rbac';

interface CampaignApprovalWorkflowProps {
  campaignId: string;
  campaignName: string;
  currentApprovals: number;
  approvers: Array<{ userId: string; userName: string; approvedAt: string }>;
  requiredApprovals?: number;
  currentUserId: string;
  currentUserRole: Role;
  onApprove: (campaignId: string, userId: string) => Promise<void>;
  onReject: (campaignId: string, userId: string, reason: string) => Promise<void>;
}

interface _ApprovalStatus {
  status: 'pending' | 'approved' | 'rejected';
  approvers: Array<{ userId: string; userName: string; approvedAt: string }>;
  rejected?: boolean;
  rejectReason?: string;
}

export function CampaignApprovalWorkflow({
  campaignId,
  campaignName,
  currentApprovals,
  approvers,
  requiredApprovals = CAMPAIGN_APPROVAL_REQUIRED_ADMINS,
  currentUserId,
  currentUserRole,
  onApprove,
  onReject,
}: CampaignApprovalWorkflowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const hasApprovePermission = hasPermission(currentUserRole, 'approve_campaign');
  const hasUserApproved = approvers.some(a => a.userId === currentUserId);
  const canApprove = hasApprovePermission && !hasUserApproved;
  const isFullyApproved = currentApprovals >= requiredApprovals;

  const handleApprove = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onApprove(campaignId, currentUserId);
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
    }
  }, [campaignId, currentUserId, onApprove]);

  const handleReject = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onReject(campaignId, currentUserId, rejectReason);
    } finally {
      setIsProcessing(false);
      setRejectDialogOpen(false);
      setRejectReason('');
    }
  }, [campaignId, currentUserId, rejectReason, onReject]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-[var(--color-fg-primary)]">
            Workflow de Aprovação
          </h3>
        </div>
        <Badge
          variant={isFullyApproved ? 'secondary' : 'outline'}
          className={cn(
            isFullyApproved
              ? 'bg-green-500/20 text-green-400'
              : 'text-amber-500 border-amber-500/30'
          )}
        >
          {currentApprovals}/{requiredApprovals} aprovações
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-fg-secondary)]">
            Progresso da aprovação
          </span>
          <span className="text-[var(--color-fg-muted)]">
            {currentApprovals} de {requiredApprovals} administradores
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-[var(--color-noir-700)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentApprovals / requiredApprovals) * 100}%` }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-green-500"
          />
        </div>
      </div>

      {/* Required Roles Info */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
            <span className="text-sm font-medium text-[var(--color-fg-secondary)]">
              Funções que podem aprovar
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
              Administrador
            </Badge>
            <Badge variant="secondary" className="bg-red-500/20 text-red-400">
              Super Administrador
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
              Gerente
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Approvers List */}
      {approvers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--color-fg-secondary)]">
            Aprovações concedidas
          </p>
          {approvers.map((approver) => (
            <div
              key={approver.userId}
              className="flex items-center justify-between rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                    {approver.userName}
                  </p>
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Aprovou em {new Date(approver.approvedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User's own status */}
      {hasUserApproved && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <p className="text-sm text-green-400">
            Você já aprovou esta campanha
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {canApprove && (
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4" />
            Aprovar campanha
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setRejectDialogOpen(true)}
            className="flex-1"
          >
            <XCircle className="h-4 w-4" />
            Rejeitar
          </Button>
        </div>
      )}

      {/* Not authorized message */}
      {!hasApprovePermission && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-[var(--color-fg-muted)]" />
          <p className="text-sm text-[var(--color-fg-muted)]">
            Você não tem permissão para aprovar campanhas
          </p>
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar campanha</DialogTitle>
            <DialogDescription>
              Você está prestes a aprovar a campanha "{campaignName}" para lançamento.
              Esta ação será registrada no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4">
              <p className="text-sm text-[var(--color-fg-secondary)]">
                Após sua aprovação, faltará(m){" "}
                <strong className="text-[var(--color-accent)]">
                  {requiredApprovals - currentApprovals - 1}
                </strong>{" "}
                aprovações para que esta campanha possa ser lançada.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleApprove} isLoading={isProcessing}>
              Confirmar aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar campanha</DialogTitle>
            <DialogDescription>
              Forneça um motivo para a rejeição da campanha "{campaignName}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeição (opcional)..."
              className="h-24 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 py-2 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} isLoading={isProcessing}>
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CampaignApprovalWorkflow;