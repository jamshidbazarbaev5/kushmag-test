import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceTable } from "../helpers/ResourceTable";
import { toast } from "sonner";
import {
  useGetUsers,
  useUpdateUser,
  useDeleteUser,
  useChangeUserPassword,
} from "../api/user";
import type { User } from "../api/user";
import EditUserModal from "@/components/modals/EditUserModal";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";
import { Button } from "@/components/ui/button";
import { KeyIcon } from "lucide-react";
import { formatNumber } from "../helpers/formatters";

const columns = (
  t: (key: string, options?: Record<string, unknown>) => string,
) => [
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
    // cell: (info: { row: { original: User } }) => {
    //   const role = info.row?.original.role as string;
    //   return t(`roles.${role?.toLowerCase()}`);
    // }
  },
  {
    header: t("forms.fixed_salary"),
    accessorKey: "fixed_salary",
    cell: (row: User) => {
      console.log("Fixed salary cell - row:", row);
      const value = row.fixed_salary;
      console.log("Fixed salary value:", value);
      return formatNumber(value);
    },
  },
  {
    header: t("forms.order_percentage"),
    accessorKey: "order_percentage",
    cell: (row: User) => {
      console.log("Order percentage cell - row:", row);
      const value = row.order_percentage;
      console.log("Order percentage value:", value);
      return formatNumber(value);
    },
  },
];

export default function UsersPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] =
    useState<User | null>(null);
  const { t } = useTranslation();

  const { data: usersData, isLoading } = useGetUsers({
    params: {
      search: searchTerm,
      page: currentPage,
    },
  });

  const users = Array.isArray(usersData) ? usersData : usersData?.results || [];
  const totalCount = Array.isArray(usersData)
    ? usersData.length
    : usersData?.count || 0;

  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();
  const { mutate: changePassword, isPending: isChangingPassword } =
    useChangeUserPassword();

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

  const handlePasswordChange = (user: User) => {
    setSelectedUserForPassword(user);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = (newPassword: string) => {
    if (!selectedUserForPassword?.id) return;

    changePassword(
      { userId: selectedUserForPassword.id, new_password: newPassword },
      {
        onSuccess: () => {
          toast.success(
            t("messages.success.password_changed", {
              username: selectedUserForPassword.username,
            }),
          );
          setIsPasswordModalOpen(false);
          setSelectedUserForPassword(null);
        },
        onError: () => {
          toast.error(
            t("messages.error.password_change", {
              username: selectedUserForPassword.username,
            }),
          );
        },
      },
    );
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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <ResourceTable
        data={users}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate("/create-user")}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pageSize={10}
        actions={(user) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePasswordChange(user)}
            className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-500"
            title={t("actions.change_password")}
          >
            <KeyIcon className="h-4 w-4" />
          </Button>
        )}
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

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedUserForPassword(null);
        }}
        onConfirm={handlePasswordSubmit}
        userName={selectedUserForPassword?.username}
        isLoading={isChangingPassword}
      />
    </div>
  );
}
