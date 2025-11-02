"use client";

import React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";

export const AttachmentGroup = Node.create({
  name: "attachmentGroup",
  group: "block",
  content: "attachmentBlock+", // One or more blocks
  draggable: false, // The group itself is not draggable, but children are
  selectable: true,
  isolating: true,

  addAttributes() {
    return {
      groupId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="attachment-group"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "attachment-group", "class": "attachment-group" }),
      0, // Content slot
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentGroupView);
  },
});

function AttachmentGroupView({ node }: any) {
  const childCount = node.childCount;

  return (
    <NodeViewWrapper
      as="div"
      className="my-3 relative"
      data-attachment-group
      data-child-count={childCount}
    >
      <div className="border-2 border-blue-200 bg-blue-50/30 rounded-lg p-3">
        {/* Visual indicator that this is a group */}
        <div className="absolute -top-2.5 left-4 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium z-10">
          Group ({childCount})
        </div>
        
        {/* Horizontal flex container for grouped cards */}
        <div 
          className="flex flex-row gap-3 w-full"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '0.75rem',
            width: '100%',
          }}
        >
          <NodeViewContent 
            className="contents"
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

