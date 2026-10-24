import { CourierMessagesManager } from "@/components/admin/CourierMessagesManager";
import { CourierTemplateForm } from "@/components/admin/CourierTemplateForm";
import { listCourierMessageOrders, buildCourierMessage } from "@/lib/admin/courierMessages";
import { getCourierTemplateSettings } from "@/lib/admin/courierSettings";
import { requireModulePage } from "@/lib/admin/auth";
import { todayKey } from "@/lib/dates";

export default async function AdminCourierMessagesPage() {
  await requireModulePage("courier_messages");

  const today = todayKey();
  const [orders, template] = await Promise.all([
    listCourierMessageOrders(today),
    getCourierTemplateSettings(),
  ]);
  const messages = orders.map((order, index) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerPhone: order.customerPhone,
    hasRiderPickupTime: order.riderPickupTime !== null,
    message: buildCourierMessage(template, order, today, index + 1),
  }));

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-3xl font-semibold text-brand-chocolate">Courier Messages</h1>

      <section>
        <CourierMessagesManager initialDate={today} initialMessages={messages} />
      </section>

      <section>
        <h2 className="mb-1 font-display text-xl font-semibold text-brand-chocolate">
          Courier message template
        </h2>
        <p className="mb-3 font-body text-sm text-brand-chocolate/60">
          The boilerplate text (courier name, your contact details, the standard note) that appears
          on every generated courier message above.
        </p>
        <CourierTemplateForm initial={template} />
      </section>
    </div>
  );
}
