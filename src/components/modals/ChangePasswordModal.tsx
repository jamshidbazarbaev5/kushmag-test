import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPassword: string) => void;
  userName?: string;
  isLoading?: boolean;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isLoading = false,
}: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = () => {
    onConfirm(newPassword);
  };

  const handleClose = () => {
    setNewPassword("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("actions.change_password")}</DialogTitle>
          <DialogDescription>
            {userName
              ? t("messages.change_password_for_user", { username: userName })
              : t("messages.change_password_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="newPassword">{t("forms.new_password")}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("placeholders.enter_new_password")}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !newPassword}>
            {isLoading ? t("common.loading") : t("actions.change_password")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
