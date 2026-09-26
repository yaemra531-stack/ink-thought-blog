# Antigravity 博客项目构建中网络断流与双代理冲突分析报告

> **报告文件**：`NETWORK_DIAGNOSIS_REPORT.md`  
> **生成时间**：2026-09-26 22:42:00  
> **受检设备**：macOS  
> **涉及服务**：Google CloudCode API (`daily-cloudcode-pa.googleapis.com`)、YouTu 加速器、Clash Verge

---

## 一、 我们在做什么（背景与业务上下文）

在本次交互中，我们正在通过 **Antigravity IDE** 为你从零构建一个极具人文质感的高品质个人独立博客：
- **视觉风格**：极简文风、大留白排版、宋体（Noto Serif SC）与西文衬线体（Newsreader）双语排版度量，支持“纸白、暖羊皮、暗曜石”三套典雅主题。
- **技术架构**：选用 **Vite + React** 现代化轻量技术栈，并严格按照你的要求，采用**本地纯文本 Markdown 维护模式**（文章存放在 `src/content/posts/`，天然适合 Git 版本控制与长期留存）。
- **已完成进度**：已编写并完成了 5 篇高质量图文长文、Markdown 语法解析器、代码语法高亮与一键复制功能、文章大纲目录（TOC）滑动追踪、全文快捷搜索（`⌘K`）、灵感速记与碎片流（Thoughts）、按年份时间线归档（Archive）以及本地 Markdown 导出助手。

---

## 二、 遇到了什么问题（现象与错误复盘）

在继续进行界面组件整合、涉及**大段长文本代码流式生成**的过程中，系统连续中断并弹出了如下网络错误：

### 1. IDE 交互界面报错
弹窗提示：
> **Error Unknown**: There was a network issue connecting to the server, please try again.  
> **Error ID**: `b8b91335-7321-4dc4-88f8-de2d4ebab319-92`

### 2. 底层传输协议错误日志
后台截获到了底层的真实通信异常：
```text
Error: stream reading error: unexpected EOF
Error: request failed: Post "https://daily-cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse": EOF
read tcp 198.18.0.1:60793 -> 198.18.0.67:443: read: connection reset by peer
```

### 3. 用户的疑惑
用户反馈：“*还是显示有网络问题，我没有使用 Clash，我使用的是 YouTu。那么这个问题有没有什么别的方式解决？*”

---

## 三、 深入分析问题的原因（为什么会发生？）

通过执行底层网络探测、路由表追踪以及进程快照，排查出以下深层根因：

### 1. 排除项：谷歌服务器与本地物理宽带完全正常
- **谷歌服务测试**：直接向 `daily-cloudcode-pa.googleapis.com` 与 Google 主站发送探测包，TLS 1.3 握手完全成功，谷歌的 ESF（Edge Server Frontend）边缘服务器处于健康响应状态。
- **本地局域网测试**：本地物理网卡 `en1`（IP: `192.168.3.131`）与本地路由器（`192.168.3.1`）通信稳定，无物理丢包。

### 2. 根本原因：本地两款科学上网工具在底层“神仙打架”
- 用户正在使用的前台客户端是 **YouTu (优途/悠兔)**；
- 但是，电脑后台中**以前启动过的 Clash Verge 并没有真正完全退出**，其提权核心服务 `verge-mihomo` 依然在后台静默运行。

### 3. 致命冲突：虚拟网卡与全局路由强行劫持（Fake-IP）
- Clash Verge 开启了 **TUN 模式（虚拟网卡增强模式）**，在 macOS 内核中创建了一个名为 `utun6` 的虚拟网卡，绑定了 IP `198.18.0.1`。
- 同时，Clash 修改了 macOS 的核心路由表（Routing Table），将全电脑 `0.0.0.0/0`（全网所有流量，包括去往谷歌服务器的请求）**全部强制劫持并下一跳路由到 `utun6 (198.18.0.1)`**。
- **冲突发生**：由于用户以为 Clash 已经不用了，把注意力放在了 YouTu 上，导致流量被强行拐进 Clash 的虚拟网卡后无人接管或出现死循环。两个代理工具同时争抢路由和套接字，最终导致代理内核主动向 IDE 发送了 `TCP RST`（Reset 重置）报文，长连接被强行切断。

### 4. 核心认知差：为什么普通上网正常，而 AI 代码生成会断连？
这是最容易让人产生误解的地方：
- **普通浏览网页 / 刷社交媒体**：基于“短平快”的短连接（HTTP GET/POST）。浏览器发起请求，几十毫秒拿到内容就关闭连接；就算遇到偶发丢包或重置，浏览器会在后台自动毫秒级静默重试，人类肉眼根本察觉不到。
- **AI 编程代码生成**：基于 **SSE（Server-Sent Events）超长流式连接**。AI 在输出大段代码时，客户端与谷歌云端需要维持一条**长达数分钟不能有一丝抖动**的 HTTP/2 双向长通道。在如此漫长的持续传输窗口中，只要底层两款代理工具发生一次路由抢占、丢包或超时，整个 SSE 流就会瞬间崩塌，抛出 `unexpected EOF`（意外遇到流结束符）和 `connection reset by peer`（连接被对端重置）。

---

## 四、 底层排查实测证据表（第一手数据）

| 探测项目 | 抓取到的底层事实证据 | 对应说明 |
| :--- | :--- | :--- |
| **进程快照 (`ps aux`)** | `root 1146 ... YouTuCore`<br>`curry 1138 ... YouTu`<br>`curry 1124 ... clash-verge`<br>`root 1257 ... verge-mihomo` | 证明 **YouTu** 与 **Clash Verge** 两个完全不同的代理体系同时在后台运行。 |
| **虚拟网卡 (`ifconfig`)** | `utun6: flags=8051<UP,POINTOPOINT>`<br>`inet 198.18.0.1 --> 198.18.0.1` | 证明 Clash 的虚拟网卡牢牢霸占着网络接口，且报错中的 `198.18.0.1` 正是出自该网卡。 |
| **核心路由表 (`netstat -nr`)** | `1 198.18.0.1 utun6`<br>`2/7 198.18.0.1 utun6`<br>`128.0/1 198.18.0.1 utun6` | 证明整台 Mac 的所有对外网络流量全部被无差别塞进了 `utun6`，绕过了物理真实通道。 |
| **系统代理配置 (`scutil`)** | `HTTPProxy : 127.0.0.1`<br>`HTTPPort : 7892` | 证明系统默认代理端口依然被指向了 Clash 的 `7892` 端口。 |

---

## 五、 后续自主研究与彻底解决指引

当你后续有空想要调试和恢复该网络环境时，可按以下指引操作：

### 方案 1：彻底清理 Clash Verge 残留，仅保留 YouTu 独占接管（推荐）
1. 打开 Mac 顶部菜单栏右上角，找到 Clash Verge 托盘图标；
2. 先**关闭 TUN 模式**，再点击 **Quit（彻底退出）**；
3. 打开终端运行以下命令，确保残留进程已彻底销毁：
   ```bash
   pkill -9 -f clash-verge
   ```
4. 验证虚拟网卡 `198.18.0.1` 是否已经释放注销：
   ```bash
   ifconfig | grep "198.18.0.1"
   # 如果没有任何输出，说明虚拟网卡已成功注销，路由恢复正常
   ```

### 方案 2：保持单一代理时的稳定性设置（针对 SSE 长连接）
无论最终选用 YouTu 还是 Clash：
- **避免自动选择节点**：尽量手动固定到一个低延迟、低丢包的香港、日本或新加坡节点，不要选 Auto / URL-Test 自动轮询模式（自动测速跳点会导致流式连接瞬间掐断）。
- **确保分流规则覆盖**：确保 `googleapis.com` 与 `google.com` 处于代理名单中，避免请求直连国内 DNS 遭到污染断流。
