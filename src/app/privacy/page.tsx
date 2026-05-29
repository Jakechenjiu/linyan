export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-mono text-3xl font-bold mb-8">隐私政策</h1>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-mono text-lg font-bold mb-3">1. 信息收集</h2>
          <p className="text-muted-foreground">
            本平台收集以下信息：
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>注册信息：邮箱、用户名</li>
            <li>创作内容：小说、文章、笔记等</li>
            <li>使用数据：访问时间、功能使用情况</li>
          </ul>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">2. 信息使用</h2>
          <p className="text-muted-foreground">
            收集的信息仅用于：
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>提供和改进服务</li>
            <li>用户身份验证</li>
            <li>技术问题排查</li>
          </ul>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">3. API Key 安全</h2>
          <p className="text-muted-foreground">
            本平台采用用户自带API Key模式。用户的API Key仅在用户发起AI请求时使用，本平台不存储、不记录用户的API Key。
          </p>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">4. 信息存储</h2>
          <p className="text-muted-foreground">
            用户数据存储在安全的服务器上，采用加密存储。创作内容仅存储在用户账号下，其他用户无法访问（除非用户主动公开）。
          </p>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">5. 信息共享</h2>
          <p className="text-muted-foreground">
            本平台不会将用户信息出售、出租或以其他方式分享给第三方，除非：
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>法律法规要求</li>
            <li>保护本平台合法权益</li>
            <li>用户同意</li>
          </ul>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">6. 用户权利</h2>
          <p className="text-muted-foreground">
            用户有权：
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>查看、修改个人信息</li>
            <li>导出创作内容</li>
            <li>删除账号及所有数据</li>
          </ul>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">7. 联系方式</h2>
          <p className="text-muted-foreground">
            如有隐私相关问题，请联系平台客服。
          </p>
        </section>
      </div>
    </div>
  );
}
