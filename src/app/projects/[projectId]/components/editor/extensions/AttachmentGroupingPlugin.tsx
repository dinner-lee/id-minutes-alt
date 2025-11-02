import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/core';
import { Slice, Fragment } from '@tiptap/pm/model';

// Store for tracking drag state
let draggedBlockPos: number | null = null;
let draggedFromGroup: { groupPos: number; childIndex: number } | null = null;

// Helper function to clean up groups with 0 or 1 child
function cleanupEmptyGroups(view: any) {
  const { state } = view;
  const { doc, tr } = state;
  let modified = false;
  
  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'attachmentGroup') {
      if (node.childCount === 0) {
        // Delete empty group
        tr.delete(pos, pos + node.nodeSize);
        modified = true;
      } else if (node.childCount === 1) {
        // Ungroup - replace with single child
        const child = node.firstChild;
        if (child) {
          tr.replaceWith(pos, pos + node.nodeSize, child);
          modified = true;
        }
      }
    }
  });
  
  if (modified) {
    view.dispatch(tr);
  }
}

export const AttachmentGroupingPlugin = Extension.create({
  name: 'attachmentGrouping',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('attachmentGrouping'),
        
        state: {
          init() {
            return { hoveredBlock: null, canGroup: false };
          },
          apply(tr, value) {
            const meta = tr.getMeta(this);
            if (meta) {
              return { ...value, ...meta };
            }
            return value;
          },
        },
        
        props: {
          handleDrop(view, event, slice, moved) {
            // Only handle if we're moving nodes within the document
            if (!moved) return false;
            
            // Clean up visual feedback
            document.querySelectorAll('[data-grouping-highlight]').forEach(el => {
              el.removeAttribute('data-grouping-highlight');
            });
            
            // Check if we're dropping a ChatGPT block
            const droppedNode = slice.content.firstChild;
            if (!droppedNode || droppedNode.type.name !== 'attachmentBlock' || droppedNode.attrs.type !== 'CHATGPT') {
              // If dragging from a group, check if group needs cleanup after TipTap's default behavior
              if (draggedFromGroup) {
                setTimeout(() => {
                  cleanupEmptyGroups(view);
                  draggedBlockPos = null;
                  draggedFromGroup = null;
                }, 50);
              }
              return false;
            }
            
            // Get drop coordinates
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (!coords) return false;
            
            const { doc, schema, tr } = view.state;
            const dropPos = coords.pos;
            
            try {
              // Check what's immediately before the drop position
              let adjacentNode = null;
              let adjacentPos = -1;
              let isAfter = false;
              
              // Try to find node before drop position
              if (dropPos > 0) {
                const $pos = doc.resolve(dropPos);
                const before = $pos.nodeBefore;
                
                if (before && before.type.name === 'attachmentBlock' && before.attrs.type === 'CHATGPT') {
                  adjacentNode = before;
                  adjacentPos = dropPos - before.nodeSize;
                  isAfter = true;
                } else {
                  // Check node after drop position
                  const after = $pos.nodeAfter;
                  if (after && after.type.name === 'attachmentBlock' && after.attrs.type === 'CHATGPT') {
                    adjacentNode = after;
                    adjacentPos = dropPos;
                    isAfter = false;
                  }
                }
              }
              
              // If we found an adjacent ChatGPT block, group them
              if (adjacentNode && adjacentPos >= 0) {
                // Create new group with both blocks
                const blocksToGroup = isAfter ? [adjacentNode, droppedNode] : [droppedNode, adjacentNode];
                
                const groupNode = schema.nodes.attachmentGroup.create(
                  { groupId: `group-${Date.now()}` },
                  blocksToGroup
                );
                
                // Replace the adjacent block with the group
                tr.replaceWith(adjacentPos, adjacentPos + adjacentNode.nodeSize, groupNode);
                
                // If dragged from a group, clean it up
                if (draggedFromGroup) {
                  setTimeout(() => {
                    cleanupEmptyGroups(view);
                    draggedBlockPos = null;
                    draggedFromGroup = null;
                  }, 50);
                }
                
                view.dispatch(tr);
                return true;
              }
              
              // No adjacent block - if dragged from group, just cleanup after default move
              if (draggedFromGroup) {
                setTimeout(() => {
                  cleanupEmptyGroups(view);
                  draggedBlockPos = null;
                  draggedFromGroup = null;
                }, 50);
              }
            } catch (e) {
              console.error('Error grouping:', e);
              return false;
            }
            
            // No adjacent ChatGPT block found, let default behavior happen
            return false;
          },
          
          handleDOMEvents: {
            dragstart: (view, event) => {
              const target = event.target as HTMLElement;
              
              // Only handle if it's an attachment block
              const attachmentWrapper = target.closest('[data-node-view-wrapper]');
              if (!attachmentWrapper) return false;
              
              try {
                // Find the position of the dragged node
                const pos = view.posAtDOM(attachmentWrapper as Node, 0);
                if (pos < 0) return false;
                
                const $pos = view.state.doc.resolve(pos);
                const node = $pos.nodeAfter;
                
                if (node && node.type.name === 'attachmentBlock' && node.attrs.type === 'CHATGPT') {
                  draggedBlockPos = pos;
                  
                  // Check if dragging from a group (only if not at document root)
                  if ($pos.depth > 0 && $pos.parent.type.name === 'attachmentGroup') {
                    const groupStart = $pos.start() - 1;
                    let childIndex = 0;
                    $pos.parent.forEach((child, offset, index) => {
                      if (offset < pos - groupStart - 1) {
                        childIndex++;
                      }
                    });
                    draggedFromGroup = { groupPos: groupStart, childIndex };
                  } else {
                    draggedFromGroup = null;
                  }
                }
              } catch (e) {
                console.warn('Drag start error:', e);
              }
              
              // Don't prevent default - let TipTap handle the drag
              return false;
            },
            
            dragover: (view, event) => {
              // Only add visual feedback if we're dragging a ChatGPT block
              if (!draggedBlockPos) return false;
              
              const { doc } = view.state;
              const draggedNode = doc.nodeAt(draggedBlockPos);
              if (!draggedNode || draggedNode.type.name !== 'attachmentBlock' || draggedNode.attrs.type !== 'CHATGPT') {
                return false;
              }
              
              // Get cursor position
              const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (!coords) return false;
              
              try {
                const $pos = doc.resolve(coords.pos);
                
                // Check if there's a ChatGPT block before or after the cursor
                const before = $pos.nodeBefore;
                const after = $pos.nodeAfter;
                
                let targetNode = null;
                let targetPos = -1;
                
                if (before && before.type.name === 'attachmentBlock' && before.attrs.type === 'CHATGPT') {
                  targetNode = before;
                  targetPos = coords.pos - before.nodeSize;
                } else if (after && after.type.name === 'attachmentBlock' && after.attrs.type === 'CHATGPT') {
                  targetNode = after;
                  targetPos = coords.pos;
                }
                
                // Add visual feedback
                document.querySelectorAll('[data-grouping-highlight]').forEach(el => {
                  el.removeAttribute('data-grouping-highlight');
                });
                
                if (targetNode && targetPos >= 0) {
                  const dom = view.nodeDOM(targetPos);
                  if (dom && dom instanceof HTMLElement) {
                    const wrapper = dom.closest('[data-node-view-wrapper]');
                    if (wrapper) {
                      wrapper.setAttribute('data-grouping-highlight', 'true');
                    }
                  }
                }
              } catch (e) {
                // Ignore errors
              }
              
              return false;
            },
            
            dragend: (view, event) => {
              // Clean up
              document.querySelectorAll('[data-grouping-highlight]').forEach(el => {
                el.removeAttribute('data-grouping-highlight');
              });
              
              draggedBlockPos = null;
              draggedFromGroup = null;
              
              return false;
            },
          },
        },
      }),
    ];
  },
  
  addCommands() {
    return {
      groupBlocks: (positions: number[]) => ({ state, tr, dispatch }) => {
        if (positions.length < 2 || positions.length > 4) {
          return false;
        }

        const { schema } = state;
        const blocks: any[] = [];
        
        // Collect the blocks
        positions.forEach(pos => {
          const node = state.doc.nodeAt(pos);
          if (node && node.type.name === 'attachmentBlock' && node.attrs.type === 'CHATGPT') {
            blocks.push(node);
          }
        });

        if (blocks.length < 2) {
          return false;
        }

        // Create group with collected blocks
        const groupNode = schema.nodes.attachmentGroup.create(
          { groupId: `group-${Date.now()}` },
          blocks
        );

        // Replace first block with the group
        const firstPos = Math.min(...positions);
        tr.replaceWith(firstPos, firstPos + blocks[0].nodeSize, groupNode);

        // Delete other blocks (in reverse order to maintain positions)
        const sortedPositions = positions.sort((a, b) => b - a);
        sortedPositions.slice(1).forEach(pos => {
          const node = tr.doc.nodeAt(pos);
          if (node) {
            tr.delete(pos, pos + node.nodeSize);
          }
        });

        if (dispatch) {
          dispatch(tr);
        }

        return true;
      },

      ungroupBlock: (groupPos: number) => ({ state, tr, dispatch }) => {
        const groupNode = state.doc.nodeAt(groupPos);
        
        if (!groupNode || groupNode.type.name !== 'attachmentGroup') {
          return false;
        }

        // Extract all child blocks
        const blocks: any[] = [];
        groupNode.forEach(child => {
          blocks.push(child);
        });

        // Replace group with individual blocks
        let currentPos = groupPos;
        tr.delete(groupPos, groupPos + groupNode.nodeSize);
        
        blocks.forEach(block => {
          tr.insert(currentPos, block);
          currentPos += block.nodeSize;
        });

        if (dispatch) {
          dispatch(tr);
        }

        return true;
      },
    };
  },
});

