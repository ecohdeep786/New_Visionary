import { InputField, PhoneInput } from "@/components/auth/AuthUI";

export default function OrgInfo({ data, updateData }) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <InputField
        label="Institution name"
        value={data.org_name || ""}
        onChange={(e) => updateData("org_name", e.target.value)}
        autoFocus
        required
      />
      <InputField
        label="Organization email"
        type="email"
        value={data.org_email || ""}
        onChange={(e) => updateData("org_email", e.target.value)}
        required
      />
      <PhoneInput
        label="Phone number"
        value={data.org_phone || ""}
        onChange={(v) => updateData("org_phone", v)}
      />
      <InputField
        label="Website (optional)"
        value={data.org_website || ""}
        onChange={(e) => updateData("org_website", e.target.value)}
      />
      <InputField
        label="Full address"
        value={data.org_address || ""}
        onChange={(e) => updateData("org_address", e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="City"
          value={data.org_city || ""}
          onChange={(e) => updateData("org_city", e.target.value)}
          required
        />
        <InputField
          label="PIN code"
          value={data.org_pin || ""}
          onChange={(e) => updateData("org_pin", e.target.value)}
          required
        />
      </div>
    </div>
  );
}