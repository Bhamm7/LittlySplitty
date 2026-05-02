import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal, FolderOpen, Tag, EyeOff, Wand2, ArrowRightLeft } from 'lucide-react';
import type { Transaction, Category, Tag as TagType } from '@littysplitty/shared';
import { useUpdateTransaction } from '../../hooks/useTransactions.js';
import RuleCreateDialog from './RuleCreateDialog.js';

interface Props {
  transaction: Transaction;
  categories: Category[];
  tags: TagType[];
}

export default function TransactionMenu({ transaction, categories, tags }: Props) {
  const updateTx = useUpdateTransaction();
  const [ruleDialog, setRuleDialog] = useState<{
    open: boolean;
    categoryId?: string;
    tagId?: string;
    isIgnored?: boolean;
    isTransfer?: boolean;
  }>({ open: false });

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px] z-50" sideOffset={5} align="end">
            {/* Category submenu */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none">
                <FolderOpen className="w-4 h-4" />
                Set Category
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50">
                  {categories.map((cat) => (
                    <DropdownMenu.Item
                      key={cat.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                      onSelect={() => updateTx.mutate({ id: transaction.id, changes: { category_id: cat.id } })}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#9E9E9E' }} />
                      {cat.name}
                    </DropdownMenu.Item>
                  ))}
                  {transaction.category_id && (
                    <>
                      <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                      <DropdownMenu.Item
                        className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer outline-none"
                        onSelect={() => updateTx.mutate({ id: transaction.id, changes: { category_id: null } })}
                      >
                        Remove Category
                      </DropdownMenu.Item>
                    </>
                  )}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            {/* Tag submenu */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none">
                <Tag className="w-4 h-4" />
                Set Tag
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-50">
                  {tags.map((tag) => (
                    <DropdownMenu.Item
                      key={tag.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                      onSelect={() => updateTx.mutate({ id: transaction.id, changes: { tag_id: tag.id } })}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || '#9E9E9E' }} />
                      {tag.name}
                    </DropdownMenu.Item>
                  ))}
                  {transaction.tag_id && (
                    <>
                      <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                      <DropdownMenu.Item
                        className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer outline-none"
                        onSelect={() => updateTx.mutate({ id: transaction.id, changes: { tag_id: null } })}
                      >
                        Remove Tag
                      </DropdownMenu.Item>
                    </>
                  )}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

            {/* Ignore */}
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
              onSelect={() => updateTx.mutate({ id: transaction.id, changes: { is_ignored: !transaction.is_ignored } })}
            >
              <EyeOff className="w-4 h-4" />
              {transaction.is_ignored ? 'Unignore' : 'Ignore'}
            </DropdownMenu.Item>

            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
              onSelect={() => updateTx.mutate({ id: transaction.id, changes: { is_transfer: !transaction.is_transfer } })}
            >
              <ArrowRightLeft className="w-4 h-4" />
              {transaction.is_transfer ? 'Unmark Transfer' : 'Mark as Transfer'}
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

            {/* Create Rule */}
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer outline-none"
              onSelect={() => setRuleDialog({
                open: true,
                categoryId: transaction.category_id || undefined,
                tagId: transaction.tag_id || undefined,
                isTransfer: transaction.is_transfer || undefined,
              })}
            >
              <Wand2 className="w-4 h-4" />
              Create Rule from This...
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <RuleCreateDialog
        open={ruleDialog.open}
        onClose={() => setRuleDialog({ open: false })}
        transaction={transaction}
        categories={categories}
        tags={tags}
        prefill={{ categoryId: ruleDialog.categoryId, tagId: ruleDialog.tagId, isIgnored: ruleDialog.isIgnored, isTransfer: ruleDialog.isTransfer }}
      />
    </>
  );
}
