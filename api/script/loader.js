export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");
  if (req.headers["user-agent"] !== "MakalHubExecutor") return res.status(403).end("Forbidden");

  const lua = `
local r = (syn and syn.request) or (http and http.request) or http_request or request or (fluxus and fluxus.request) or (krnl and krnl.request)
assert(r, "Executor not supported")
local h = game:GetService("HttpService")
local p = game.Players.LocalPlayer
local placeId = game.PlaceId
local g = {
  [537413528] = "babft",
  [109983668079237] = "stealabrainrot",
  [18687417158] = "forsaken"
}
local n = g[placeId]
assert(n, "Game not supported")

local i = r({
  Url = ("https://makalhub.vercel.app/api/init?userid=%d&username=%s"):format(p.UserId, h:UrlEncode(p.Name)),
  Method = "GET",
  Headers = { ["User-Agent"] = "MakalHubExecutor" }
})
assert(i and i.Body, "Init failed")

local j = h:JSONDecode(i.Body)
local k = r({
  Url = ("https://makalhub.vercel.app/api/script/%s?token=%s"):format(n, h:UrlEncode(j.token)),
  Method = "GET",
  Headers = { ["User-Agent"] = "MakalHubExecutor" }
})
assert(k and k.Body, "Script fetch failed")
loadstring(k.Body)()
  `

  res.setHeader("Content-Type", "text/plain")
  return res.status(200).send(lua)
}
