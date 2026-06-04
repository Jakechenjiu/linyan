// 灵砚动画系统 — 基于 anime.js v4

import { animate, stagger, utils, type AnimationParams } from "animejs";

// ============ 基础动画工具 ============

/** 淡入 */
export function fadeIn(
  targets: string | Element | Element[],
  opts?: Partial<AnimationParams>
) {
  return animate(targets, {
    opacity: [0, 1],
    duration: 400,
    ease: "outQuart",
    ...opts,
  });
}

/** 淡出 */
export function fadeOut(
  targets: string | Element | Element[],
  opts?: Partial<AnimationParams>
) {
  return animate(targets, {
    opacity: [1, 0],
    duration: 300,
    ease: "inQuart",
    ...opts,
  });
}

/** 从下方滑入 */
export function slideUp(
  targets: string | Element | Element[],
  opts?: Partial<AnimationParams>
) {
  return animate(targets, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 400,
    ease: "outQuart",
    ...opts,
  });
}

/** 从左侧滑入 */
export function slideInLeft(
  targets: string | Element | Element[],
  opts?: Partial<AnimationParams>
) {
  return animate(targets, {
    opacity: [0, 1],
    translateX: [-20, 0],
    duration: 400,
    ease: "outQuart",
    ...opts,
  });
}

/** 缩放弹入 */
export function scaleIn(
  targets: string | Element | Element[],
  opts?: Partial<AnimationParams>
) {
  return animate(targets, {
    opacity: [0, 1],
    scale: [0.8, 1],
    duration: 400,
    ease: "outBack",
    ...opts,
  });
}

/** 数字递增动画 */
export function countUp(
  target: string | Element,
  endValue: number,
  opts?: Partial<AnimationParams> & { duration?: number }
) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  const obj = { value: 0 };
  return animate(obj, {
    value: endValue,
    duration: opts?.duration || 1000,
    ease: "outQuart",
    onUpdate: () => {
      (el as HTMLElement).textContent = Math.round(obj.value).toString();
    },
    ...opts,
  });
}

// ============ 管线进度动画 ============

/** 管线阶段切换动画 */
export function animatePipelineStage(
  stageElement: string | Element,
  status: "entering" | "active" | "done"
) {
  const el = typeof stageElement === "string"
    ? document.querySelector(stageElement)
    : stageElement;
  if (!el) return;

  switch (status) {
    case "entering":
      return animate(el, {
        opacity: [0, 1],
        translateX: [-10, 0],
        duration: 300,
        ease: "outQuart",
      });
    case "active":
      return animate(el, {
        scale: [1, 1.02, 1],
        duration: 600,
        ease: "inOutSine",
        loop: true,
      });
    case "done":
      return animate(el, {
        opacity: [1, 0.7],
        scale: [1.02, 1],
        duration: 200,
        ease: "outQuart",
      });
  }
}

/** 管线完成庆祝动画 */
export function animatePipelineComplete(container: string | Element) {
  const elements = utils.$(`${typeof container === "string" ? container : ""} .pipeline-stage`);
  if (elements.length === 0) return;

  return animate(elements, {
    opacity: [0.7, 1],
    scale: [1, 1.05, 1],
    delay: stagger(50),
    duration: 400,
    ease: "outBack",
  });
}

// ============ 打字机效果 ============

/** 逐字显示文本（打字机效果） */
export function typewriter(
  target: string | Element,
  text: string,
  opts?: {
    speed?: number;        // 每个字符的间隔（ms）
    cursor?: boolean;      // 是否显示光标
    onComplete?: () => void;
  }
) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  const speed = opts?.speed || 30;
  const showCursor = opts?.cursor !== false;
  let index = 0;

  (el as HTMLElement).textContent = "";
  if (showCursor) {
    (el as HTMLElement).style.borderRight = "2px solid var(--cyan)";
  }

  const interval = setInterval(() => {
    if (index < text.length) {
      (el as HTMLElement).textContent += text[index];
      index++;
    } else {
      clearInterval(interval);
      if (showCursor) {
        // 光标闪烁
        animate(el, {
          borderRightColor: ["transparent", "var(--cyan)"],
          duration: 500,
          ease: "inOutSine",
          loop: 3,
        }).then?.(() => {
          (el as HTMLElement).style.borderRight = "none";
        });
      }
      opts?.onComplete?.();
    }
  }, speed);

  return {
    stop: () => clearInterval(interval),
    element: el,
  };
}

/** 流式文本追加（AI 生成文字时逐段显示） */
export function streamTextAppend(
  target: string | Element,
  newChunk: string
) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  const span = document.createElement("span");
  span.textContent = newChunk;
  span.style.opacity = "0";
  el.appendChild(span);

  return animate(span, {
    opacity: [0, 1],
    duration: 150,
    ease: "outQuart",
  });
}

// ============ 消息气泡动画 ============

/** 新消息入场动画 */
export function animateMessageIn(element: string | Element) {
  return animate(element, {
    opacity: [0, 1],
    translateY: [15, 0],
    scale: [0.97, 1],
    duration: 350,
    ease: "outQuart",
  });
}

/** 工具调用标签入场 */
export function animateToolCallIn(elements: string | Element[]) {
  return animate(elements, {
    opacity: [0, 1],
    scale: [0.8, 1],
    delay: stagger(60),
    duration: 300,
    ease: "outBack",
  });
}

// ============ 页面过渡 ============

/** 页面淡入 */
export function pageEnter(container: string | Element) {
  return animate(container, {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 400,
    ease: "outQuart",
  });
}

/** 页面淡出 */
export function pageExit(container: string | Element) {
  return animate(container, {
    opacity: [1, 0],
    translateY: [0, -10],
    duration: 250,
    ease: "inQuart",
  });
}

// ============ 微交互 ============

/** 按钮点击反馈 */
export function buttonPress(element: string | Element) {
  return animate(element, {
    scale: [1, 0.95, 1],
    duration: 200,
    ease: "outQuart",
  });
}

/** 审计分数跳动 */
export function scoreReveal(element: string | Element, score: number) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) return;

  // 先缩放弹入
  animate(el, {
    scale: [0.5, 1.1, 1],
    opacity: [0, 1],
    duration: 500,
    ease: "outBack",
  });

  // 数字递增
  countUp(el, score, { duration: 800 });
}

/** 维度条形图动画 */
export function dimensionBarAnimate(elements: string | Element[]) {
  return animate(elements, {
    scaleX: [0, 1],
    delay: stagger(40),
    duration: 400,
    ease: "outQuart",
  });
}

/** 真相文件展开动画 */
export function truthFileExpand(content: string | Element) {
  return animate(content, {
    height: [0, "auto"],
    opacity: [0, 1],
    duration: 300,
    ease: "outQuart",
  });
}

/** 真相文件收起动画 */
export function truthFileCollapse(content: string | Element) {
  return animate(content, {
    height: ["auto", 0],
    opacity: [1, 0],
    duration: 250,
    ease: "inQuart",
  });
}
