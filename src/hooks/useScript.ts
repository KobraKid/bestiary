import { useEffect } from "react";

const useScript = (contents?: string) => {
    useEffect(() => {
        const script = document.createElement("script");
        script.text = contents + `
        {
            // Build links
            document.querySelectorAll("[data-bestiary-link]").forEach(link => {
                link.addEventListener('click', () => {
                    const event = new CustomEvent("link", { detail: link.dataset.bestiaryLink });
                    window.dispatchEvent(event);
                });
            });
        }
        `;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, [contents]);
};

export default useScript;