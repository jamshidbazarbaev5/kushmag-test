import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceTable } from "../helpers/ResourceTable";
import { toast } from "sonner";
import { useGetUsers, useUpdateUser, useDeleteUser } from "../api/user";
import type { User } from "../api/user";
import EditUserModal from "@/components/modals/EditUserModal";

const columns = (t: (key: string, options?: Record<string, any>) => string) => [
  {
    header: t("forms.username"),
    accessorKey: "username",
  },
  {
    header: t("forms.full_name"),
    accessorKey: "full_name",
  },
  {
    header: t("forms.phone_number"),
    accessorKey: "phone_number",
  },
  {
    header: t("forms.role"),
    accessorKey: "role",
    // cell: (info: any) => {
    //   const role = info.row?.original.role as string;
    //   return t(`roles.${role?.toLowerCase()}`);
    // }
  },
  {
    header: t("forms.fixed_salary"),
    accessorKey: "fixed_salary",
  },
  {
    header: t("forms.order_percentage"),
    accessorKey: "order_percentage",
  },
];

export default function UsersPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  const { data: usersData, isLoading } = useGetUsers({
    params: {
      search: searchTerm,
    },
  });

  const users = Array.isArray(usersData) ? usersData : usersData?.results || [];
  const enhancedUsers = users.map((user: User, index: number) => ({
    ...user,
    displayId: index + 1,
  }));

  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<User>) => {
    if (!editingUser?.id) return;

    updateUser({ ...data, id: editingUser.id } as User, {
      onSuccess: () => {
        toast.success(
          t("messages.success.updated", { item: t("navigation.users") }),
        );
        setIsFormOpen(false);
        setEditingUser(null);
      },
      onError: () =>
        toast.error(
          t("messages.error.update", { item: t("navigation.users") }),
        ),
    });
  };

  const handleDelete = (id: number) => {
    deleteUser(id, {
      onSuccess: () =>
        toast.success(
          t("messages.success.deleted", { item: t("navigation.users") }),
        ),
      onError: () =>
        toast.error(
          t("messages.error.delete", { item: t("navigation.users") }),
        ),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("navigation.users")}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t("placeholders.search_user")}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ResourceTable
        data={enhancedUsers}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate("/create-user")}
      />

      <EditUserModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleUpdateSubmit}
        isLoading={isUpdating}
      />
    </div>
  );
}
