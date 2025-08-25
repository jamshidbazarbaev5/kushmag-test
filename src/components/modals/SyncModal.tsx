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
import { AVAILABLE_MODELS } from "../../core/api/sync";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedModels: string[]) => void;
  isLoading?: boolean;
}

export function SyncModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: SyncModalProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const handleModelToggle = (modelKey: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelKey)
        ? prev.filter((key) => key !== modelKey)
        : [...prev, modelKey],
    );
  };

  const handleSelectAll = () => {
    const allModelKeys = Object.keys(AVAILABLE_MODELS);
    setSelectedModels(
      selectedModels.length === allModelKeys.length ? [] : allModelKeys,
    );
  };

  const handleConfirm = () => {
    if (selectedModels.length === 0) return;
    onConfirm(selectedModels);
  };

  const handleClose = () => {
    setSelectedModels([]);
    onClose();
  };

  const allSelected =
    selectedModels.length === Object.keys(AVAILABLE_MODELS).length;
  const someSelected =
    selectedModels.length > 0 &&
    selectedModels.length < Object.keys(AVAILABLE_MODELS).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Выберите модели для синхронизации</DialogTitle>
          <DialogDescription>
            Выберите модели данных, которые нужно синхронизировать с сервером
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Select All Checkbox */}
          <div className="flex items-center space-x-2 mb-4 pb-4 border-b">
            <input
              type="checkbox"
              id="select-all"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {allSelected ? "Снять выделение со всех" : "Выбрать все"}
            </label>
          </div>

          {/* Model Checkboxes */}
          <div className="space-y-3">
            {Object.entries(AVAILABLE_MODELS).map(([key, translation]) => (
              <div key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={key}
                  checked={selectedModels.includes(key)}
                  onChange={() => handleModelToggle(key)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label
                  htmlFor={key}
                  className="text-sm leading-none cursor-pointer"
                >
                  {translation}
                </label>
              </div>
            ))}
          </div>

          {selectedModels.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                Выбрано моделей: {selectedModels.length} из{" "}
                {Object.keys(AVAILABLE_MODELS).length}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedModels.length === 0 || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Синхронизация...
              </div>
            ) : (
              `Синхронизировать (${selectedModels.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
