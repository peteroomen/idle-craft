import React from "react";
import Icon from "@/components/icon";

export default function NotFoundPage() {

    return (
        <div className="flex flex-row justify-center items-center gap-2">
            <Icon imgPath="/icons/log-1.png" size="lg"/>
            <span className="text-lg"><span className="font-bold">404</span> - Woodn&apos;t you rather load a page that exists?</span>
        </div>
    )
}
