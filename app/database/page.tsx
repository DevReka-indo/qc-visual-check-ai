export default function DatabasePage() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Database</h1>
            <p className="text-muted-foreground">
                Manage datasets and structured records.
            </p>

            <div className="rounded-xl border shadow">
                <div className="p-6 pb-4">
                    <h3 className="font-semibold leading-none tracking-tight">Records Table</h3>
                </div>
                <div className="p-6 pt-0">
                    <div className="h-[300px] w-full border-dashed border-2 rounded flex items-center justify-center text-muted-foreground">
                        Data table goes here.
                    </div>
                </div>
            </div>
        </div>
    )
}
