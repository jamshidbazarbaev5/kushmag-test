import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useCreateUser } from "../api/user";
import type { User } from "../api/user";
import { useGetSellers, useGetOperators, useGetZamershiks } from "../api/staff";
import { useWatch, useForm } from "react-hook-form";
import { useMemo } from "react";

const userFields = (
  t: any,
  {
    sellers,
    operators,
    zamershiks,
  }: { sellers?: any[]; operators?: any[]; zamershiks?: any[] },
  currentRole?: string,
) => [
  {
    name: "username",
    label: t("forms.username"),
    type: "text",
    placeholder: t("placeholders.enter_username"),
    required: true,
  },
  {
    name: "password",
    label: t("forms.password"),
    type: "password",
    placeholder: t("placeholders.enter_password"),
    required: true,
  },
  {
    name: "full_name",
    label: t("forms.full_name"),
    type: "text",
    placeholder: t("placeholders.enter_full_name"),
    required: true,
  },
  {
    name: "phone_number",
    label: t("forms.phone_number"),
    type: "text",
    placeholder: t("placeholders.enter_phone_number"),
    required: true,
  },
  {
    name: "role",
    label: t("forms.role"),
    type: "select",
    required: true,
    options: [
      { value: "ADMIN", label: t("roles.admin") },
      { value: "PRODAVEC", label: t("roles.prodavec") },
      { value: "MANUFACTURE", label: t("roles.manufacture") },
      { value: "ZAMERSHIK", label: t("roles.zamershik") },
      { value: "OPERATOR", label: t("roles.operator") },
      { value: "SOTRUDNIK", label: t("roles.sotrudnik") },
    ],
    onChange: (
      value: string,
      _formData: any,
      onChange: (field: string, value: any) => void,
    ) => {
      onChange("role", value);
      onChange("staff_member", "");
    },
  },
  {
    name: "staff_member",
    label: t("forms.staff_member"),
    type: "select",
    required: (formData: any) =>
      ["PRODAVEC", "OPERATOR", "ZAMERSHIK"].includes(formData.role),
    options: () => {
      // Use the watched role value instead of formData.role
      const role = currentRole;
      if (role === "PRODAVEC" && sellers) {
        return sellers.map((seller) => ({
          label: seller.name,
          value: JSON.stringify(seller),
        }));
      }
      if (role === "OPERATOR" && operators) {
        return operators.map((operator) => ({
          label: operator.name,
          value: JSON.stringify(operator),
        }));
      }
      if (role === "ZAMERSHIK" && zamershiks) {
        return zamershiks.map((zamershik) => ({
          label: zamershik.name,
          value: JSON.stringify(zamershik),
        }));
      }
      return [];
    },
    show: () =>
      ["PRODAVEC", "OPERATOR", "ZAMERSHIK"].includes(currentRole || ""),
  },
  {
    name: "api_login",
    label: t("forms.api_login"),
    type: "text",
    placeholder: t("placeholders.enter_api_login"),
  },
  {
    name: "api_password",
    label: t("forms.api_password"),
    type: "password",
    placeholder: t("placeholders.enter_api_password"),
  },
  {
    name: "fixed_salary",
    label: t("forms.fixed_salary"),
    type: "number",
    placeholder: t("placeholders.enter_fixed_salary"),
  },
  {
    name: "order_percentage",
    label: t("forms.order_percentage"),
    type: "number",
    placeholder: t("placeholders.enter_order_percentage"),
  },
];

export default function CreateUserPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { data: sellers } = useGetSellers();
  const { data: operators } = useGetOperators();
  const { data: zamershiks } = useGetZamershiks();

  // Create form instance to watch values
  const form = useForm<User & { staff_member?: string }>({
    defaultValues: {
      username: "",
      password: "",
      full_name: "",
      phone_number: "",
      role: "ADMIN" as const,
      staff_member: "",
      api_login: "",
      api_password: "",
      fixed_salary: 0,
      order_percentage: 0,
    },
  });

  // Watch the role field to dynamically update options
  const watchedRole = useWatch({
    control: form.control,
    name: "role",
  });

  // Memoize fields to prevent unnecessary re-renders
  const fields = useMemo(
    () => userFields(t, { sellers, operators, zamershiks }, watchedRole),
    [t, sellers, operators, zamershiks, watchedRole],
  );

  const handleSubmit = (data: User & { staff_member?: string }) => {
    const formData = { ...data };

    if (formData.staff_member) {
      try {
        const staffMember = JSON.parse(formData.staff_member);
        formData.moy_sklad_staff = {
          meta: staffMember.meta,
        };
        delete formData.staff_member;
      } catch (e) {
        console.error("Failed to parse staff member data");
      }
    }

    createUser(formData, {
      onSuccess: () => {
        toast.success(
          t("messages.success.created", { item: t("navigation.users") }),
        );
        navigate("/users");
      },
      onError: () =>
        toast.error(
          t("messages.error.create", { item: t("navigation.users") }),
        ),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("navigation.create_user")}</h1>
      </div>

      <div className="max-w-2xl">
        <ResourceForm
          fields={fields}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          form={form}
        />
      </div>
    </div>
  );
}
