export function CharacterAvatar({
  gender = "male",
  skin = "light",
  hair = "short",
  armor = "cloth",
  size = "md",
}: {
  gender?: string
  skin?: string
  hair?: string
  armor?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "w-14 h-14", // Трохи збільшив для шапки, щоб значок рівня влазив краще
    md: "w-24 h-24", // Збільшив середній розмір
    lg: "w-32 h-32",
  }

  const basePath = `/sprites/${gender}`

  const isSpikes = hair === "spikes"
  const isLong = hair === "long"
  
  const hairScale = isSpikes ? "scale-70" : isLong ? "scale-75" : "scale-75"
  
  // ЗАМІНА ПІКСЕЛІВ НА ВІДСОТКИ ДЛЯ ЗАЧІСКИ
  const hairTranslate = isSpikes ? "-translate-y-[19%]" : isLong ? "-translate-y-[8%]" : "-translate-y-[15.5%]"

  // ЗАМІНА ПІКСЕЛІВ НА ВІДСОТКИ ДЛЯ БРОНІ
  let armorTranslate = "translate-y-[19%]"
  let armorScaleX = "scale-x-[0.9]"
  
  if (armor === "leather") {
    armorTranslate = "translate-y-[12.5%]"
  } else if (armor === "cloth") {
    armorTranslate = "translate-y-[9.5%]"
  }

  // Налаштування маски
  let bodyClipPath = "none"
  if (armor === "plate") {
    bodyClipPath = "polygon(0 0, 100% 0, 100% 45%, 0 45%)"
  } else if (armor === "leather") {
    bodyClipPath = "polygon(0 0, 100% 0, 100% 45%, 0 45%)"
  } else if (armor === "cloth") {
    bodyClipPath = "polygon(0 0, 100% 0, 100% 45%, 0 45%, 0 78%, 100% 78%, 100% 100%, 0 100%)"
  }

  return (
    <div className={`relative flex items-center justify-center border-2 border-primary bg-background overflow-hidden shadow-[0_0_15px_rgba(var(--primary),0.2)] ${sizeClasses[size]}`}>
      {/* Ефект світіння / аури */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none z-40" />

      {/* Базовий контейнер персонажа */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {armor === "cloth" ? (
          <>
            {/* 1. РОБА ПЕРШОЮ */}
            <img
              src={`${basePath}/armor_${armor}.png`}
              alt="armor"
              className={`absolute inset-0 w-full h-full object-contain image-rendering-pixelated z-10 scale-y-75 ${armorScaleX} ${armorTranslate}`}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            {/* 2. ТІЛО ЗВЕРХУ РОБИ З МАСКОЮ */}
            <img
              src={`${basePath}/skin_${skin}.png`}
              alt="body"
              className="absolute inset-0 w-full h-full object-contain image-rendering-pixelated z-20"
              style={{ clipPath: bodyClipPath }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </>
        ) : (
          <>
            {/* 1. ТІЛО З МАСКОЮ */}
            <img
              src={`${basePath}/skin_${skin}.png`}
              alt="body"
              className="absolute inset-0 w-full h-full object-contain image-rendering-pixelated z-10"
              style={{ clipPath: bodyClipPath }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            {/* 2. БРОНЯ ЗВЕРХУ */}
            <img
              src={`${basePath}/armor_${armor}.png`}
              alt="armor"
              className={`absolute inset-0 w-full h-full object-contain image-rendering-pixelated z-20 scale-y-75 ${armorScaleX} ${armorTranslate}`}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </>
        )}

        {/* 3. ЗАЧІСКА ПОВЕРХ УСЬОГО */}
        {hair !== "bald" && (
          <img
            src={`${basePath}/hair_${hair}.png`}
            alt="hair"
            className={`absolute inset-0 w-full h-full object-contain image-rendering-pixelated z-30 ${hairScale} ${hairTranslate}`}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>
    </div>
  )
}