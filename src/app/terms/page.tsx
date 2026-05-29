export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-mono text-3xl font-bold mb-8">服务条款</h1>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-mono text-lg font-bold mb-3">1. 服务说明</h2>
          <p className="text-muted-foreground">
            灵砚（以下简称"本平台"）是一个AI辅助创作工具平台，提供小说写作、内容发布、笔记管理和智能推演等功能。本平台不对用户创作的内容进行审核，用户对创作内容承担全部法律责任。
          </p>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">2. 用户责任</h2>
          <p className="text-muted-foreground">
            用户在使用本平台时，应遵守中华人民共和国相关法律法规，不得创作、传播以下内容：
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>违反国家法律法规的内容</li>
            <li>色情、暴力、恐怖主义内容</li>
            <li>侵犯他人知识产权的内容</li>
            <li>虚假信息、谣言</li>
            <li>其他违法违规内容</li>
          </ul>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">3. API Key 使用</h2>
          <p className="text-muted-foreground">
            本平台采用用户自带API Key模式。用户的API Key由用户自行保管，本平台不存储用户的API Key。用户应自行承担API调用产生的费用。
          </p>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">4. 知识产权</h2>
          <p className="text-muted-foreground">
            用户在本平台创作的内容，知识产权归用户所有。本平台不主张对用户创作内容的任何权利。
          </p>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">5. 服务变更与终止</h2>
          <p className="text-muted-foreground">
            本平台保留随时修改或终止服务的权利。如发生服务变更，将提前通知用户。
          </p>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">6. 免责声明</h2>
          <p className="text-muted-foreground">
            本平台按"现状"提供服务，不作任何明示或暗示的保证。本平台不对因使用本服务产生的任何直接、间接、偶然、特殊或后果性损害承担责任。
          </p>
        </section>

        <section>
          <h2 className="font-mono text-lg font-bold mb-3">7. 联系方式</h2>
          <p className="text-muted-foreground">
            如有任何问题，请通过平台内的举报功能或联系客服。
          </p>
        </section>
      </div>
    </div>
  );
}
