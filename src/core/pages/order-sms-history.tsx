import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageSquare, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetOrderSMSHistory, useGetOrder } from "../api/order";
import { formatDateTime } from "../helpers/formatters";

export default function OrderSMSHistoryPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: smsHistory,
    isLoading: isLoadingSMS,
    error: smsError,
  } = useGetOrderSMSHistory(Number(orderId));

  const {
    data: order,
    isLoading: isLoadingOrder,
  } = useGetOrder(Number(orderId));

  if (isLoadingSMS || isLoadingOrder) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (smsError) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            {t("errors.failed_to_load_sms_history")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatCreatedAt = (dateString: string) => {
    try {
      return formatDateTime(dateString);
    } catch {
      return new Date(dateString).toLocaleString();
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">
              {t("pages.sms_history")}
            </h1>
            {order && (
              <p className="text-muted-foreground">
                {t("forms.order")}
                {order.description && ` - ${order.description}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SMS History */}
      <div className="space-y-4">
        {!smsHistory || smsHistory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {t("pages.no_sms_history")}
              </h3>
              <p className="text-muted-foreground">
                {t("pages.no_sms_history_description")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {smsHistory.map((sms) => (
              <Card key={sms.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {sms.admin.full_name}
                      </span>
                     
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatCreatedAt(sms.created_at)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {sms.text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      {smsHistory && smsHistory.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("pages.sms_statistics")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {smsHistory.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("pages.total_sms_sent")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {new Set(smsHistory.map(sms => sms.admin.id)).size}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("pages.unique_admins")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {smsHistory.length > 0
                    ? formatCreatedAt(smsHistory[smsHistory.length - 1].created_at).split(' ')[0]
                    : '-'
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("pages.last_sms_date")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
