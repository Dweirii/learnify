"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// ...existing code...
import { SearchIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import qs from "query-string";
import React, { useState } from "react";

export const SearchBar = () => {
    const router = useRouter();
    const [value, setValue] = useState("");

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!value) return;
        
        const url = qs.stringifyUrl({
            url: "/search",
            query: { term: value }
        }, { skipEmptyString: true });

        router.push(url);
        setValue("");
    };

    const onClear = () => {
        setValue("");
    }
    
    return (
        <form 
            onSubmit={ onSubmit }
            className="relative w-full lg:w-[400px] flex items-center"
        >
            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search..."
                className="rounded-r-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0 focus-visible:ring-offset-transparent"
            />
            {value && (
                <X
                    onClick={onClear}
                    size={20}
                    className="absolute top-2 right-14 h-5 w-5 text-muted-foreground cursor-pointer "
                />
            )}
            <Button
                type="submit"
                size="icon"
                variant={"secondary"}
                className="rounded-l-none"
            >
                <SearchIcon className="h-6 w-6 text-muted-foreground" />
            </Button>
        </form>
    )
}