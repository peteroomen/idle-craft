export default function Icon({imgPath, className, size = "md"}: {imgPath: string, className?: string, size?: "md" | "lg" | "xl"}) {

    const sizeClassMap = {
        "md": "size-8",
        "lg": "size-16",
        "xl": "size-32"
    }

    return <img style={{imageRendering: "pixelated"}} src={imgPath} className={`${className ?? ""} ${sizeClassMap[size]}`}></img>;
}