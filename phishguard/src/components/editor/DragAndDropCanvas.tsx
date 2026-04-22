import { useState, useCallback, useRef } from 'react';
import type { Block, BlockType } from './types';
import { generateId, defaultTextBlock, defaultImageBlock, defaultButtonBlock, defaultSpacerBlock, defaultDividerBlock } from './types';

interface DragAndDropCanvasProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onBlocksChange: (blocks: Block[]) => void;
  onSelectBlock: (id: string | null) => void;
  children: (block: Block, isSelected: boolean, onEdit: () => void) => React.ReactNode;
}

interface DragState {
  isDragging: boolean;
  draggedBlock: BlockType | null;
  dragOverIndex: number | null;
}

export function DragAndDropCanvas({
  blocks,
  selectedBlockId,
  onBlocksChange,
  onSelectBlock,
  children,
}: DragAndDropCanvasProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBlock: null,
    dragOverIndex: null,
  });
  const canvasRef = useRef<HTMLDivElement>(null);

  const _handleDragStart = useCallback((type: BlockType) => {
    setDragState(prev => ({ ...prev, isDragging: true, draggedBlock: type }));
  }, []);

  const _handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, dragOverIndex: index }));
    }
  }, [dragState.isDragging]);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!dragState.draggedBlock) return;

    const id = generateId();
    let newBlock: Block;

    switch (dragState.draggedBlock) {
      case 'text':
        newBlock = defaultTextBlock(id);
        break;
      case 'image':
        newBlock = defaultImageBlock(id);
        break;
      case 'button':
        newBlock = defaultButtonBlock(id);
        break;
      case 'spacer':
        newBlock = defaultSpacerBlock(id);
        break;
      case 'divider':
        newBlock = defaultDividerBlock(id);
        break;
      default:
        return;
    }

    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    onBlocksChange(newBlocks);
    onSelectBlock(id);

    setDragState({
      isDragging: false,
      draggedBlock: null,
      dragOverIndex: null,
    });
  }, [dragState.draggedBlock, blocks, onBlocksChange, onSelectBlock]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedBlock: null,
      dragOverIndex: null,
    });
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dragState.draggedBlock) {
      // This is a block reorder
      const blockId = e.dataTransfer.getData('text/plain');
      if (blockId && dragState.dragOverIndex !== null) {
        const blockIndex = blocks.findIndex(b => b.id === blockId);
        if (blockIndex !== -1 && blockIndex !== dragState.dragOverIndex) {
          const newBlocks = [...blocks];
          const [movedBlock] = newBlocks.splice(blockIndex, 1);
          newBlocks.splice(dragState.dragOverIndex, 0, movedBlock);
          onBlocksChange(newBlocks);
        }
      }
    }
    handleDragEnd();
  }, [dragState.draggedBlock, dragState.dragOverIndex, blocks, onBlocksChange, handleDragEnd]);

  const handleBlockDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    e.dataTransfer.setData('text/plain', blockId);
    setDragState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleBlockDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState(prev => ({ ...prev, dragOverIndex: index }));
  }, []);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  return (
    <div
      ref={canvasRef}
      className="relative min-h-[600px] bg-noir-900 rounded-lg border border-noir-700 p-4"
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragState.isDragging) {
          setDragState(prev => ({ ...prev, dragOverIndex: blocks.length }));
        }
      }}
      onDrop={handleCanvasDrop}
      onDragEnd={handleDragEnd}
    >
      {blocks.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-noir-500 pointer-events-none">
          <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-lg font-medium max-w-sm">Arraste blocos para cá</p>
          <p className="text-sm mt-1">ou clique em um bloco na barra lateral</p>
        </div>
      )}

      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            draggable
            onDragStart={(e) => handleBlockDragStart(e, block.id)}
            onDragOver={(e) => handleBlockDragOver(e, index)}
            onDrop={(e) => {
              e.stopPropagation();
              if (dragState.isDragging && dragState.draggedBlock) {
                handleDrop(e, index);
              }
            }}
            className={`
              relative group cursor-move transition-all duration-150
              ${selectedBlockId === block.id ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-noir-900' : ''}
              ${dragState.dragOverIndex === index && dragState.isDragging ? 'border-t-2 border-amber-500' : ''}
            `}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBlock(block.id);
            }}
          >
            {/* Block actions */}
            <div className={`
              absolute -right-2 top-1/2 -translate-y-1/2 z-10
              flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity
              ${selectedBlockId === block.id ? 'opacity-100' : ''}
            `}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newBlocks = blocks.filter(b => b.id !== block.id);
                  onBlocksChange(newBlocks);
                  if (selectedBlockId === block.id) {
                    onSelectBlock(null);
                  }
                }}
                className="w-6 h-6 rounded bg-noir-700 hover:bg-red-500 text-noir-300 hover:text-white flex items-center justify-center text-xs"
                title="Remover bloco"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (index > 0) {
                    moveBlock(index, index - 1);
                  }
                }}
                className="w-6 h-6 rounded bg-noir-700 hover:bg-amber-500 text-noir-300 hover:text-white flex items-center justify-center text-xs disabled:opacity-30"
                disabled={index === 0}
                title="Mover para cima"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (index < blocks.length - 1) {
                    moveBlock(index, index + 1);
                  }
                }}
                className="w-6 h-6 rounded bg-noir-700 hover:bg-amber-500 text-noir-300 hover:text-white flex items-center justify-center text-xs disabled:opacity-30"
                disabled={index === blocks.length - 1}
                title="Mover para baixo"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {children(block, selectedBlockId === block.id, () => onSelectBlock(block.id))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Export toolbar component for adding new blocks
interface BlockToolbarProps {
  onAddBlock: (type: BlockType) => void;
}

export function BlockToolbar({ onAddBlock }: BlockToolbarProps) {
  const blockTypes: { type: BlockType; label: string; icon: string }[] = [
    { type: 'text', label: 'Texto', icon: 'T' },
    { type: 'image', label: 'Imagem', icon: '🖼' },
    { type: 'button', label: 'Botão', icon: '▢' },
    { type: 'spacer', label: 'Espaçador', icon: '↕' },
    { type: 'divider', label: 'Divisor', icon: '—' },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-noir-900 rounded-lg border border-noir-700">
      {blockTypes.map(({ type, label, icon }) => (
        <button
          key={type}
          draggable
          onDragStart={() => handleDragStart(type)}
          onClick={() => onAddBlock(type)}
          className="
            flex items-center gap-2 px-3 py-2 rounded-md
            bg-noir-800 hover:bg-noir-700 text-noir-300 hover:text-amber-500
            border border-noir-700 hover:border-amber-500/50
            transition-all duration-150 cursor-grab active:cursor-grabbing
            font-mono text-sm
          "
        >
          <span className="text-base">{icon}</span>
          <span className="font-body">{label}</span>
        </button>
      ))}
    </div>
  );

  function _handleDragStart(_type: BlockType) {
    // Drag handled by parent state
  }
}