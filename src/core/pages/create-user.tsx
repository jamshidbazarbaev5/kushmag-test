import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useCreateUser } from "../api/user";
import type { User } from "../api/user";
import { useGetSellers, useGetOperators, useGetZamershiks } from "../api/staff";

const userFields = (
  t: any,
  {
    sellers,
    operators,
    zamershiks,
  }: { sellers?: any[]; operators?: any[]; zamershiks?: any[] },
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
      onChange("staff_member", null);
    },
  },
  {
    name: "staff_member",
    label: t("forms.staff_member"),
    type: "select",
    required: (formData: any) =>
      ["PRODAVEC", "OPERATOR"].includes(formData.role),
    options: (formData: any) => {
      console.log("Options formData:", formData); // Debug log
      console.log("Current role:", formData.role); // Debug log

      if (formData.role === "PRODAVEC" && sellers) {
        console.log("Sellers available:", sellers.length);
        return sellers.map((seller) => ({
          label: seller.name,
          value: JSON.stringify(seller),
        }));
      }
      if (formData.role === "OPERATOR" && operators) {
        console.log("Operators available:", operators.length);
        const mappedOperators = operators.map((operator) => ({
          label: operator.name,
          value: JSON.stringify(operator),
        }));
        console.log("Mapped operators:", mappedOperators);
        return mappedOperators;
      }
      if (formData.role === "ZAMERSHIK" && zamershiks) {
        console.log("Zamershiks available:", zamershiks.length);
        const mappedZamershiks = zamershiks.map((zamershik) => ({
          label: zamershik.name,
          value: JSON.stringify(zamershik),
        }));
        console.log("Mapped zamershiks:", mappedZamershiks);
        return mappedZamershiks;
      }
      return [];
    },
    show: (formData: any) =>
      ["PRODAVEC", "OPERATOR", "ZAMERSHIK"].includes(formData.role),
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

  //   console.log('Operators:', operators); // Debug log

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
          fields={userFields(t, { sellers, operators, zamershiks })}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
        />
      </div>
    </div>
  );
}
