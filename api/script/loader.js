module.exports = function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  if (req.headers["user-agent"] !== "MakalHubExecutor") return res.status(403).end();

  const lua = `
local r=(syn and syn.request)or(http and http.request)or(request)or(http_request)
assert(r,"Executor not supported")
local h=game:GetService("HttpService")
local p=game:GetService("Players").LocalPlayer
local i=game.PlaceId
local m={[537413528]="babft"}
local n=m[i]
assert(n,"Game not supported")
local u=("https://makalhub.vercel.app/api/init?userid=%d&username=%s"):format(p.UserId,h:UrlEncode(p.Name))
local x=r({Url=u,Method="GET",Headers={["User-Agent"]="MakalHubExecutor"}})
assert(x and x.Body,"Init failed")
local t=h:JSONDecode(x.Body).token
local s=r({Url=("https://makalhub.vercel.app/api/script/%s?token=%s"):format(n,h:UrlEncode(t)),Method="GET",Headers={["User-Agent"]="MakalHubExecutor"}})
assert(s and s.Body,"Script fetch failed")
loadstring(s.Body)()
  `

  res.setHeader("Content-Type", "text/plain")
  res.status(200).send(lua.trim())
}
