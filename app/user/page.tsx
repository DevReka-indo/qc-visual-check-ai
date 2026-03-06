export default function UserPage() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
            <h1 className="text-3xl font-bold tracking-tight font-serif">User</h1>
            <p className="text-muted-foreground">
                Manage profile, preferences, and permissions.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-4">Profile Information</h3>
                    <div className="space-y-4">
                        <div className="grid gap-1">
                            <label className="text-sm font-medium leading-none">Name</label>
                            <div className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                                John Doe
                            </div>
                        </div>
                        <div className="grid gap-1">
                            <label className="text-sm font-medium leading-none">Email</label>
                            <div className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                                john.doe@example.com
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-4">Settings</h3>
                    <p className="text-sm text-muted-foreground">Additional preferences can be configured here.</p>
                </div>
            </div>
        </div>
    )
}
