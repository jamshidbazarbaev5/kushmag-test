import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { Button } from './button';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { User } from '@/core/api/user';

interface SearchableUserSelectProps {
  value: number | undefined;
  onChange: (value: number) => void;
  users: User[];
  placeholder?: string;
  onCreateNew?: () => void;
  disabled?: boolean;
}

export function SearchableUserSelect({
  value,
  onChange,
  users,
  placeholder,
  onCreateNew,
  disabled = false,
}: SearchableUserSelectProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find(user => user.id === value);

  const handleSelectUser = (userId: string) => {
    onChange(Number(userId));
    setSearch('');
  };

  return (
    <Select
      value={value ? String(value) : ''}
      onValueChange={handleSelectUser}
      disabled={disabled}
    >
      <SelectTrigger className="w-40 min-w-40">
        <SelectValue placeholder={placeholder}>
          {selectedUser ? `${selectedUser.full_name} (${selectedUser.username})` : ''}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 sticky top-0 bg-white z-10 border-b">
          <Input
            type="text"
            placeholder={t('placeholders.type_username')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
            autoFocus
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <SelectItem key={user.id} value={String(user.id)}>
                {user.full_name} ({user.username})
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-center text-gray-500">
              {search.length === 0 ? t('placeholders.type_to_search') : t('messages.no_users_found')}
            </div>
          )}
        </div>
        {onCreateNew && (
          <div className="p-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCreateNew}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('navigation.create_user')}
            </Button>
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
